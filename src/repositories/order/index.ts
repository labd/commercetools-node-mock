import assert from "node:assert";
import type {
	Cart,
	CartReference,
	CustomLineItem,
	CustomLineItemImportDraft,
	GeneralError,
	LineItem,
	LineItemImportDraft,
	Order,
	OrderFromCartDraft,
	OrderImportDraft,
	Product,
	ProductPagedQueryResponse,
	ProductVariant,
	ShippingInfo,
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
import {
	createShippingInfoFromMethod,
	getShippingMethodsMatchingCart,
} from "#src/shipping.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository, type QueryParams } from "../abstract.ts";
import {
	createAddress,
	createCentPrecisionMoney,
	createCustomFields,
	createPrice,
	createTypedMoney,
	resolveStoreReference,
} from "../helpers.ts";
import { OrderUpdateHandler } from "./actions.ts";

export class OrderRepository extends AbstractResourceRepository<"order"> {
	constructor(config: Config) {
		super("order", config);
		this.actions = new OrderUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: OrderFromCartDraft): Order {
		assert(draft.cart, "draft.cart is missing");
		return this.createFromCart(
			context,
			{
				id: draft.cart.id!,
				typeId: "cart",
			},
			draft.orderNumber,
		);
	}

	createFromCart(
		context: RepositoryContext,
		cartReference: CartReference,
		orderNumber?: string,
	) {
		const cart = this._storage.getByResourceIdentifier(
			context.projectKey,
			cartReference,
		) as Cart | null;
		if (!cart) {
			throw new Error("Cannot find cart");
		}

		const resource: Writable<Order> = {
			...getBaseResourceProperties(),
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
		return this.saveNew(context, resource);
	}

	import(context: RepositoryContext, draft: OrderImportDraft): Order {
		// TODO: Check if order with given orderNumber already exists
		assert(this, "OrderRepository not valid");
		const resource: Writable<Order> = {
			...getBaseResourceProperties(),

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

			custom: createCustomFields(
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
			store: resolveStoreReference(
				draft.store,
				context.projectKey,
				this._storage,
			),
			syncInfo: [],

			lineItems:
				draft.lineItems?.map((item) =>
					this.lineItemFromImportDraft.bind(this)(context, item),
				) || [],
			customLineItems:
				draft.customLineItems?.map((item) =>
					this.customLineItemFromImportDraft.bind(this)(context, item),
				) || [],

			totalPrice: createCentPrecisionMoney(draft.totalPrice),
		};

		// Set shipping info after resource is created
		if (draft.shippingInfo?.shippingMethod) {
			const { ...shippingMethodRef } = draft.shippingInfo.shippingMethod;

			// get id when reference is by key only
			if (shippingMethodRef.key && !shippingMethodRef.id) {
				const shippingMethod =
					this._storage.getByResourceIdentifier<"shipping-method">(
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

			resource.shippingInfo = this.createShippingInfo(context, resource, {
				typeId: "shipping-method",
				id: shippingMethodRef.id as string,
			});
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

		return this.saveNew(context, resource);
	}

	private lineItemFromImportDraft(
		context: RepositoryContext,
		draft: LineItemImportDraft,
	): LineItem {
		let product: Product;
		let variant: ProductVariant | undefined;

		if (draft.variant.sku) {
			variant = {
				id: 0,
				sku: draft.variant.sku,
			};

			const items = this._storage.query(context.projectKey, "product", {
				where: [
					`masterData(current(masterVariant(sku="${draft.variant.sku}"))) or masterData(current(variants(sku="${draft.variant.sku}")))`,
				],
			}) as ProductPagedQueryResponse;

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
			throw new Error("No product found");
		}

		const quantity = draft.quantity ?? 1;
		const totalPrice = createCentPrecisionMoney({
			...draft.price.value,
			centAmount: (draft.price.value.centAmount ?? 0) * quantity,
		});

		const lineItem: LineItem = {
			...getBaseResourceProperties(),
			custom: createCustomFields(
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
		};

		return lineItem;
	}

	private customLineItemFromImportDraft(
		context: RepositoryContext,
		draft: CustomLineItemImportDraft,
	): CustomLineItem {
		const quantity = draft.quantity ?? 1;
		const totalPrice = createCentPrecisionMoney({
			...draft.money,
			centAmount: (draft.money.centAmount ?? 0) * quantity,
		});

		const lineItem: CustomLineItem = {
			...getBaseResourceProperties(),
			custom: createCustomFields(
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
		};

		return lineItem;
	}

	getWithOrderNumber(
		context: RepositoryContext,
		orderNumber: string,
		params: QueryParams = {},
	): Order | undefined {
		const result = this._storage.query(context.projectKey, this.getTypeId(), {
			...params,
			where: [`orderNumber="${orderNumber}"`],
		});
		if (result.count === 1) {
			return result.results[0] as Order;
		}

		// Catch this for now, should be checked when creating/updating
		if (result.count > 1) {
			throw new Error("Duplicate order numbers");
		}

		return;
	}

	createShippingInfo(
		context: RepositoryContext,
		resource: Writable<Order>,
		shippingMethodRef: ShippingMethodReference,
	): ShippingInfo {
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

		const shippingMethods = getShippingMethodsMatchingCart(
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

		const baseShippingInfo = createShippingInfoFromMethod(
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
}
