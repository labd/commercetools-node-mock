import assert from "node:assert";
import type {
	Cart,
	CartReference,
	CustomLineItem,
	CustomLineItemImportDraft,
	Delivery,
	DuplicateFieldError,
	GeneralError,
	LineItem,
	LineItemImportDraft,
	Order,
	OrderFromCartDraft,
	OrderImportDraft,
	OrderPagedSearchResponse,
	OrderSearchRequest,
	Product,
	ProductVariant,
	ReferencedResourceNotFoundError,
	ResourceNotFoundError,
	ShippingInfo,
	ShippingInfoImportDraft,
	ShippingMethodDoesNotMatchCartError,
	ShippingMethodReference,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import {
	generateRandomString,
	getBaseResourceProperties,
} from "#src/helpers.ts";
import {
	calculateTaxedPriceFromRate,
	calculateTaxTotals,
} from "#src/lib/tax.ts";
import { OrderSearch } from "#src/orderSearch.ts";
import { OrderFromCartDraftSchema } from "#src/schemas/generated/order-from-cart.ts";
import {
	createShippingInfoFromMethod,
	getShippingMethodsMatchingCart,
} from "#src/shipping.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository, type QueryParams } from "../abstract.ts";
import {
	calculateMoneyTotalCentAmount,
	createAddress,
	createCentPrecisionMoney,
	createCustomFields,
	createPrice,
	createTypedMoney,
	resolveStoreReference,
} from "../helpers.ts";
import { OrderUpdateHandler } from "./actions.ts";

export class OrderRepository extends AbstractResourceRepository<"order"> {
	protected _searchService: OrderSearch;

	constructor(config: Config) {
		super("order", config);
		this.actions = new OrderUpdateHandler(config.storage);
		this._searchService = new OrderSearch(config);
		this.draftSchema = OrderFromCartDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: OrderFromCartDraft,
	): Promise<Order> {
		assert(draft.cart, "draft.cart is missing");
		return await this.createFromCart(
			context,
			{
				id: draft.cart.id!,
				typeId: "cart",
			},
			draft.orderNumber,
		);
	}

	async createFromCart(
		context: RepositoryContext,
		cartReference: CartReference,
		orderNumber?: string,
	) {
		const cart = (await this._storage.getByResourceIdentifier(
			context.projectKey,
			cartReference,
		)) as Cart | null;
		if (!cart) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "Cannot find cart",
				},
				404,
			);
		}

		const resource: Writable<Order> = {
			...getBaseResourceProperties(context.clientId),
			anonymousId: cart.anonymousId,
			billingAddress: cart.billingAddress,
			cart: cartReference,
			country: cart.country,
			custom: cart.custom,
			customerEmail: cart.customerEmail,
			customerGroup: cart.customerGroup,
			customerId: cart.customerId,
			customLineItems: [],
			directDiscounts: cart.directDiscounts,
			discountCodes: cart.discountCodes,
			discountOnTotalPrice: cart.discountOnTotalPrice,
			lastMessageSequenceNumber: 0,
			lineItems: cart.lineItems,
			locale: cart.locale,
			orderNumber: orderNumber ?? generateRandomString(10),
			orderState: "Open",
			origin: "Customer",
			paymentInfo: cart.paymentInfo,
			refusedGifts: [],
			shipping: cart.shipping,
			shippingAddress: cart.shippingAddress,
			shippingInfo: cart.shippingInfo,
			shippingMode: cart.shippingMode,
			syncInfo: [],
			taxCalculationMode: cart.taxCalculationMode,
			taxedPrice: cart.taxedPrice,
			taxedShippingPrice: cart.taxedShippingPrice,
			taxMode: cart.taxMode,
			taxRoundingMode: cart.taxRoundingMode,
			totalPrice: cart.totalPrice,
			store: cart.store,
		};

		const { taxedPrice, taxedShippingPrice } = calculateTaxTotals({
			lineItems: cart.lineItems,
			customLineItems: cart.customLineItems,
			shippingInfo: cart.shippingInfo,
			totalPrice: cart.totalPrice,
		});
		resource.taxedPrice = resource.taxedPrice ?? taxedPrice;
		resource.taxedShippingPrice =
			resource.taxedShippingPrice ?? taxedShippingPrice;
		return await this.saveNew(context, resource);
	}

	async import(
		context: RepositoryContext,
		draft: OrderImportDraft,
	): Promise<Order> {
		// TODO: Check if order with given orderNumber already exists
		assert(this, "OrderRepository not valid");
		const lineItems = await Promise.all(
			draft.lineItems?.map((item) =>
				this.lineItemFromImportDraft(context, item),
			) || [],
		);
		const customLineItems = await Promise.all(
			draft.customLineItems?.map((item) =>
				this.customLineItemFromImportDraft(context, item),
			) || [],
		);

		const resource: Writable<Order> = {
			...getBaseResourceProperties(context.clientId),

			billingAddress: createAddress(
				draft.billingAddress,
				context.projectKey,
				this._storage,
			),
			shippingAddress: createAddress(
				draft.shippingAddress,
				context.projectKey,
				this._storage,
			),

			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			customerEmail: draft.customerEmail,
			customerId: draft.customerId,
			businessUnit: draft.businessUnit?.key
				? { typeId: "business-unit", key: draft.businessUnit.key }
				: undefined,
			lastMessageSequenceNumber: 0,
			orderNumber: draft.orderNumber,
			orderState: draft.orderState || "Open",
			origin: draft.origin || "Customer",
			paymentState: draft.paymentState,
			refusedGifts: [],
			shippingMode: "Single",
			shipping: [],
			shippingInfo: undefined,
			store: await resolveStoreReference(
				draft.store,
				context.projectKey,
				this._storage,
			),
			syncInfo: [],

			lineItems,
			customLineItems,

			totalPrice: createCentPrecisionMoney(draft.totalPrice),
		};


		if (draft.shippingInfo) {
			resource.shippingInfo = await this.shippingInfoFromImportDraft(
				context,
				resource,
				draft.shippingInfo,
			);
		}

		const { taxedPrice, taxedShippingPrice } = calculateTaxTotals({
			lineItems: resource.lineItems,
			customLineItems: resource.customLineItems,
			shippingInfo: resource.shippingInfo,
			totalPrice: resource.totalPrice,
		});
		resource.taxedPrice = resource.taxedPrice ?? taxedPrice;
		resource.taxedShippingPrice =
			resource.taxedShippingPrice ?? taxedShippingPrice;

		return await this.saveNew(context, resource);
	}

	private async lineItemFromImportDraft(
		context: RepositoryContext,
		draft: LineItemImportDraft,
	): Promise<LineItem> {
		let product: Product;
		let variant: ProductVariant | undefined;

		if (draft.variant.sku) {
			variant = {
				id: 0,
				sku: draft.variant.sku,
			};

			const items = await this._storage.query(context.projectKey, "product", {
				where: [
					`masterData(current(masterVariant(sku="${draft.variant.sku}"))) or masterData(current(variants(sku="${draft.variant.sku}")))`,
				],
			});

			if (items.count !== 1) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A product containing a variant with SKU '${draft.variant.sku}' not found.`,
				});
			}

			product = items.results[0];
			if (product.masterData.current.masterVariant.sku === draft.variant.sku) {
				variant = product.masterData.current.masterVariant;
			} else {
				variant = product.masterData.current.variants.find(
					(v) => v.sku === draft.variant.sku,
				);
			}
			if (!variant) {
				throw new Error("Internal state error");
			}
		} else {
			throw new CommercetoolsError<ReferencedResourceNotFoundError>({
				code: "ReferencedResourceNotFound",
				message: "No product found",
				typeId: "product",
			});
		}

		const quantity = draft.quantity ?? 1;
		const totalPrice = createCentPrecisionMoney({
			currencyCode: draft.price.value.currencyCode,
			centAmount: calculateMoneyTotalCentAmount(draft.price.value, quantity),
		});

		return {
			...getBaseResourceProperties(context.clientId),
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			discountedPricePerQuantity: [],
			lineItemMode: "Standard",
			name: draft.name,
			price: createPrice(draft.price),
			priceMode: "Platform",
			productId: product.id,
			productType: product.productType,
			quantity,
			state: draft.state || [],
			taxRate: draft.taxRate,
			taxedPrice: calculateTaxedPriceFromRate(
				totalPrice.centAmount,
				totalPrice.currencyCode,
				draft.taxRate,
			),
			taxedPricePortions: [],
			perMethodTaxRate: [],
			totalPrice,
			variant: {
				id: variant.id,
				sku: variant.sku,
				price: createPrice(draft.price),
				attributes: variant.attributes,
			},
		} satisfies LineItem;
	}

	private async customLineItemFromImportDraft(
		context: RepositoryContext,
		draft: CustomLineItemImportDraft,
	): Promise<CustomLineItem> {
		const quantity = draft.quantity ?? 1;
		const totalPrice = createCentPrecisionMoney({
			currencyCode: draft.money.currencyCode,
			centAmount: calculateMoneyTotalCentAmount(draft.money, quantity),
		});

		return {
			...getBaseResourceProperties(context.clientId),
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			discountedPricePerQuantity: [],
			money: createTypedMoney(draft.money),
			name: draft.name,
			quantity,
			perMethodTaxRate: [],
			priceMode: draft.priceMode ?? "Standard",
			slug: draft.slug,
			state: [],
			totalPrice,
			taxedPrice: calculateTaxedPriceFromRate(
				totalPrice.centAmount,
				totalPrice.currencyCode,
				draft.taxRate,
			),
			taxedPricePortions: [],
		} satisfies CustomLineItem;
	}

	async getWithOrderNumber(
		context: RepositoryContext,
		orderNumber: string,
		params: QueryParams = {},
	): Promise<Order | undefined> {
		const result = await this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{
				...params,
				where: [`orderNumber="${orderNumber}"`],
			},
		);
		if (result.count === 1) {
			return result.results[0] as Order;
		}

		// Catch this for now, should be checked when creating/updating
		if (result.count > 1) {
			throw new CommercetoolsError<DuplicateFieldError>({
				code: "DuplicateField",
				message: "Duplicate order numbers",
				field: "orderNumber",
				duplicateValue: orderNumber,
			});
		}

		return;
	}

	async createShippingInfo(
		context: RepositoryContext,
		resource: Writable<Order>,
		shippingMethodRef: ShippingMethodReference,
	): Promise<Writable<ShippingInfo>> {
		const cartLikeForMatching: Writable<Cart> = {
			...resource,
			cartState: "Active" as const,
			inventoryMode: "None" as const,
			itemShippingAddresses: [],
			priceRoundingMode: resource.taxRoundingMode || "HalfEven",
			taxMode: resource.taxMode || "Platform",
			taxCalculationMode: resource.taxCalculationMode || "LineItemLevel",
			taxRoundingMode: resource.taxRoundingMode || "HalfEven",
			discountCodes: resource.discountCodes || [],
			directDiscounts: resource.directDiscounts || [],
			shippingInfo: undefined,
		};

		const shippingMethods = await getShippingMethodsMatchingCart(
			context,
			this._storage,
			cartLikeForMatching,
			{
				expand: ["zoneRates[*].zone"],
			},
		);

		const method = shippingMethods.results.find(
			(candidate) => candidate.id === shippingMethodRef.id,
		);

		if (!method) {
			throw new CommercetoolsError<ShippingMethodDoesNotMatchCartError>({
				code: "ShippingMethodDoesNotMatchCart",
				message: `The shipping method with ID '${shippingMethodRef.id}' is not allowed for the order with ID '${resource.id}'.`,
			});
		}

		const baseShippingInfo = await createShippingInfoFromMethod(
			context,
			this._storage,
			resource,
			method,
		);

		return {
			...baseShippingInfo,
			deliveries: [],
		};
	}

	private async shippingInfoFromImportDraft(
		context: RepositoryContext,
		resource: Writable<Order>,
		draft: ShippingInfoImportDraft,
	): Promise<ShippingInfo | undefined> {
		if (!draft.shippingMethod) {
			return undefined
		}

		const { ...shippingMethodRef } = draft.shippingMethod;
		if (shippingMethodRef.key && !shippingMethodRef.id) {
			const shippingMethod =
				await this._storage.getByResourceIdentifier<"shipping-method">(
					context.projectKey,
					shippingMethodRef,
				);
			if (!shippingMethod) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A shipping method with key '${shippingMethodRef.key}' does not exist.`,
				});
			}
			shippingMethodRef.id = shippingMethod.id;
		}

		const shippingInfo = await this.createShippingInfo(context, resource, {
			typeId: "shipping-method",
			id: shippingMethodRef.id as string,
		});

		shippingInfo.deliveries = await this.deliveriesFromImportDraft(context, draft)
		return shippingInfo;

	}

	private async deliveriesFromImportDraft(
		context: RepositoryContext,
		draft: ShippingInfoImportDraft,
	): Promise<Delivery[]> {
		if (!draft.deliveries) return [];

		return Promise.all(
			draft.deliveries.map(async (deliveryDraft) => ({
				...getBaseResourceProperties(),
				key: deliveryDraft.key,
				items: deliveryDraft.items ?? [],
				parcels: await Promise.all(
					deliveryDraft.parcels?.map(async (parcel) => ({
						...getBaseResourceProperties(),
						...parcel,
						custom: await createCustomFields(
							parcel.custom,
							context.projectKey,
							this._storage,
						),
					})) ?? [],
				),
				address: createAddress(
					deliveryDraft.address,
					context.projectKey,
					this._storage,
				),
				custom: await createCustomFields(
					deliveryDraft.custom,
					context.projectKey,
					this._storage,
				),
			})),
		);
	}

	async search(
		context: RepositoryContext,
		searchRequest: OrderSearchRequest,
	): Promise<OrderPagedSearchResponse> {
		return await this._searchService.search(context.projectKey, searchRequest);
	}
}
