import type {
	BusinessUnit,
	InvalidOperationError,
} from "@commercetools/platform-sdk";
import type {
	Cart,
	CartDraft,
	GeneralError,
	LineItem,
	LineItemDraft,
	Product,
	ProductPagedQueryResponse,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import type { Config } from "~src/config";
import { CommercetoolsError } from "~src/exceptions";
import { getBaseResourceProperties } from "~src/helpers";
import type { Writable } from "~src/types";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract";
import { createAddress, createCustomFields } from "../helpers";
import { CartUpdateHandler } from "./actions";
import { calculateCartTotalPrice, selectPrice } from "./helpers";

export class CartRepository extends AbstractResourceRepository<"cart"> {
	constructor(config: Config) {
		super("cart", config);
		this.actions = new CartUpdateHandler(this._storage);
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

		let storedBusinessUnit: BusinessUnit | undefined = undefined;
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
			customLineItems: [],
			directDiscounts: [],
			discountCodes: [],
			inventoryMode: "None",
			itemShippingAddresses: [],
			lineItems,
			locale: draft.locale,
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
			: undefined;

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

		return {
			id: uuidv4(),
			productId: product.id,
			productKey: product.key,
			productSlug: product.masterData.current.slug,
			productType: product.productType,
			name: product.masterData.current.name,
			variant,
			price: price,
			totalPrice: {
				type: "centPrecision",
				currencyCode: price.value.currencyCode,
				fractionDigits: price.value.fractionDigits,
				centAmount: price.value.centAmount * quant,
			},
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
}
