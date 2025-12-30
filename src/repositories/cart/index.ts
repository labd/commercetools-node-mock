import type {
	BusinessUnit,
	Cart,
	CartDraft,
	DiscountCodeInfo,
	GeneralError,
	InvalidOperationError,
	LineItem,
	LineItemDraft,
	Product,
	ProductPagedQueryResponse,
	ShippingMethodDoesNotMatchCartError,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { calculateTaxTotals } from "#src/lib/tax.ts";
import {
	createShippingInfoFromMethod,
	getShippingMethodsMatchingCart,
} from "#src/shipping.ts";
import type { Writable } from "#src/types.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import {
	calculateMoneyTotalCentAmount,
	createAddress,
	createCentPrecisionMoney,
	createCustomFields,
} from "../helpers.ts";
import { CartUpdateHandler } from "./actions.ts";
import {
	calculateCartTotalPrice,
	createCustomLineItemFromDraft,
	createDiscountCodeInfoFromCode,
	selectPrice,
} from "./helpers.ts";

export class CartRepository extends AbstractResourceRepository<"cart"> {
	constructor(config: Config) {
		super("cart", config);
		this.actions = new CartUpdateHandler(this._storage, this);
	}

	create(context: RepositoryContext, draft: CartDraft): Cart {
		if (draft.anonymousId && draft.customerId) {
			throw new CommercetoolsError<InvalidOperationError>({
				code: "InvalidOperation",
				message: "Can set only one of customer OR anonymousId",
			});
		}

		// Validate that the customer exists
		if (draft.customerId) {
			this._storage.getByResourceIdentifier(context.projectKey, {
				typeId: "customer",
				id: draft.customerId,
			});
		}

		let storedBusinessUnit: BusinessUnit | undefined;
		if (draft.businessUnit?.id || draft.businessUnit?.key) {
			storedBusinessUnit =
				this._storage.getByResourceIdentifier<"business-unit">(
					context.projectKey,
					{
						typeId: "business-unit",
						id: draft.businessUnit.id,
						key: draft.businessUnit.key,
					},
				);
		}

		const lineItems =
			draft.lineItems?.map((draftLineItem) =>
				this.draftLineItemtoLineItem(
					context.projectKey,
					draftLineItem,
					draft.currency,
					draft.country,
				),
			) ?? [];

		const customLineItems =
			draft.customLineItems?.map((draftCustomLineItem) =>
				createCustomLineItemFromDraft(
					context.projectKey,
					draftCustomLineItem,
					this._storage,
					draft.shippingAddress?.country ?? draft.country,
				),
			) ?? [];

		// Validate that discount codes exist
		const discountCodeInfo: DiscountCodeInfo[] = [];
		if (draft.discountCodes?.length) {
			draft.discountCodes.forEach((code) => {
				discountCodeInfo.push(
					createDiscountCodeInfoFromCode(
						context.projectKey,
						this._storage,
						code,
					),
				);
			});
		}

		const resource: Writable<Cart> = {
			...getBaseResourceProperties(),
			anonymousId: draft.anonymousId,
			businessUnit:
				storedBusinessUnit && draft.businessUnit
					? {
							typeId: draft.businessUnit.typeId,
							key: storedBusinessUnit.key,
						}
					: undefined,
			billingAddress: draft.billingAddress
				? createAddress(draft.billingAddress, context.projectKey, this._storage)
				: undefined,
			cartState: "Active",
			country: draft.country,
			customerId: draft.customerId,
			customerEmail: draft.customerEmail,
			customLineItems,
			directDiscounts: [],
			discountCodes: discountCodeInfo,
			inventoryMode: "None",
			itemShippingAddresses: [],
			lineItems,
			locale: draft.locale,
			priceRoundingMode: draft.priceRoundingMode ?? "HalfEven",
			taxCalculationMode: draft.taxCalculationMode ?? "LineItemLevel",
			taxMode: draft.taxMode ?? "Platform",
			taxRoundingMode: draft.taxRoundingMode ?? "HalfEven",
			totalPrice: {
				type: "centPrecision",
				centAmount: 0,
				currencyCode: draft.currency,
				fractionDigits: 0,
			},
			shippingMode: "Single",
			shippingAddress: draft.shippingAddress
				? createAddress(
						draft.shippingAddress,
						context.projectKey,
						this._storage,
					)
				: undefined,
			shipping: [],
			shippingInfo: undefined,
			origin: draft.origin ?? "Customer",
			refusedGifts: [],
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
		resource.store = context.storeKey
			? { typeId: "store", key: context.storeKey }
			: draft.store?.key
				? { typeId: "store", key: draft.store.key }
				: undefined;

		// Set shipping info after resource is created
		if (draft.shippingMethod) {
			resource.shippingInfo = this.createShippingInfo(
				context,
				resource,
				draft.shippingMethod,
			);
		}

		const { taxedPrice, taxedShippingPrice } = calculateTaxTotals(resource);
		resource.taxedPrice = taxedPrice;
		resource.taxedShippingPrice = taxedShippingPrice;

		return this.saveNew(context, resource);
	}

	getActiveCart(projectKey: string): Cart | undefined {
		// Get first active cart
		const results = this._storage.query(projectKey, this.getTypeId(), {
			where: [`cartState="Active"`],
		});
		if (results.count > 0) {
			return results.results[0] as Cart;
		}

		return;
	}

	draftLineItemtoLineItem = (
		projectKey: string,
		draftLineItem: LineItemDraft,
		currency: string,
		country: string | undefined,
	): LineItem => {
		const { productId, quantity, variantId, sku } = draftLineItem;

		let product: Product | null = null;

		if (productId && variantId) {
			// Fetch product and variant by ID
			product = this._storage.get(projectKey, "product", productId, {});
		} else if (sku) {
			// Fetch product and variant by SKU
			const items = this._storage.query(projectKey, "product", {
				where: [
					`masterData(current(masterVariant(sku="${sku}"))) or masterData(current(variants(sku="${sku}")))`,
				],
			}) as ProductPagedQueryResponse;

			if (items.count === 1) {
				product = items.results[0];
			}
		}

		if (!product) {
			// Check if product is found
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: sku
					? `A product containing a variant with SKU '${sku}' not found.`
					: `A product with ID '${productId}' not found.`,
			});
		}

		// Find matching variant
		const variant = [
			product.masterData.current.masterVariant,
			...product.masterData.current.variants,
		].find((x) => {
			if (sku) return x.sku === sku;
			if (variantId) return x.id === variantId;
			return false;
		});

		if (!variant) {
			// Check if variant is found
			throw new Error(
				sku
					? `A variant with SKU '${sku}' for product '${product.id}' not found.`
					: `A variant with ID '${variantId}' for product '${product.id}' not found.`,
			);
		}

		const quant = quantity ?? 1;

		const price = selectPrice({ prices: variant.prices, currency, country });
		if (!price) {
			throw new Error(
				`No valid price found for ${productId} for country ${country} and currency ${currency}`,
			);
		}

		const totalPrice = createCentPrecisionMoney({
			currencyCode: price.value.currencyCode,
			centAmount: calculateMoneyTotalCentAmount(price.value, quant),
		});

		return {
			id: uuidv4(),
			productId: product.id,
			productKey: product.key,
			productSlug: product.masterData.current.slug,
			productType: product.productType,
			name: product.masterData.current.name,
			variant,
			price: price,
			totalPrice,
			taxedPricePortions: [],
			perMethodTaxRate: [],
			quantity: quant,
			discountedPricePerQuantity: [],
			lineItemMode: "Standard",
			priceMode: "Platform",
			state: [],
			custom: createCustomFields(
				draftLineItem.custom,
				projectKey,
				this._storage,
			),
		};
	};

	createShippingInfo(
		context: RepositoryContext,
		resource: Writable<Cart>,
		shippingMethodRef: NonNullable<CartDraft["shippingMethod"]>,
	): NonNullable<Cart["shippingInfo"]> {
		if (resource.taxMode === "External") {
			throw new Error("External tax rate is not supported");
		}

		// Bit of a hack: calling this checks that the resource identifier is
		// valid (i.e. id xor key) and that the shipping method exists.
		this._storage.getByResourceIdentifier<"shipping-method">(
			context.projectKey,
			shippingMethodRef,
		);

		// getShippingMethodsMatchingCart does the work of determining whether the
		// shipping method is allowed for the cart, and which shipping rate to use
		const shippingMethods = getShippingMethodsMatchingCart(
			context,
			this._storage,
			resource,
			{
				expand: ["zoneRates[*].zone"],
			},
		);

		const method = shippingMethods.results.find((candidate) =>
			shippingMethodRef.id
				? candidate.id === shippingMethodRef.id
				: candidate.key === shippingMethodRef.key,
		);

		// Not finding the method in the results means it's not allowed, since
		// getShippingMethodsMatchingCart only returns allowed methods and we
		// already checked that the method exists.
		if (!method) {
			throw new CommercetoolsError<ShippingMethodDoesNotMatchCartError>({
				code: "ShippingMethodDoesNotMatchCart",
				message: `The shipping method with ${shippingMethodRef.id ? `ID '${shippingMethodRef.id}'` : `key '${shippingMethodRef.key}'`} is not allowed for the cart with ID '${resource.id}'.`,
			});
		}

		// Use the shared shipping info creation logic
		return createShippingInfoFromMethod(
			context,
			this._storage,
			resource,
			method,
		);
	}
}
