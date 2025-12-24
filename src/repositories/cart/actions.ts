import type {
	Address,
	AddressDraft,
	Cart,
	CartAddCustomLineItemAction,
	CartAddItemShippingAddressAction,
	CartAddLineItemAction,
	CartChangeCustomLineItemMoneyAction,
	CartChangeCustomLineItemQuantityAction,
	CartChangeLineItemQuantityAction,
	CartChangeTaxRoundingModeAction,
	CartRemoveCustomLineItemAction,
	CartRemoveDiscountCodeAction,
	CartRemoveLineItemAction,
	CartRemoveShippingMethodAction,
	CartSetAnonymousIdAction,
	CartSetBillingAddressAction,
	CartSetBillingAddressCustomTypeAction,
	CartSetCountryAction,
	CartSetCustomerEmailAction,
	CartSetCustomerIdAction,
	CartSetCustomFieldAction,
	CartSetCustomShippingMethodAction,
	CartSetCustomTypeAction,
	CartSetDirectDiscountsAction,
	CartSetLineItemCustomFieldAction,
	CartSetLineItemCustomTypeAction,
	CartSetLineItemPriceAction,
	CartSetLineItemShippingDetailsAction,
	CartSetLocaleAction,
	CartSetShippingAddressAction,
	CartSetShippingAddressCustomFieldAction,
	CartSetShippingAddressCustomTypeAction,
	CartSetShippingMethodAction,
	CartUpdateAction,
	CustomFields,
	GeneralError,
	ItemShippingDetails,
	LineItem,
	Product,
	ProductPagedQueryResponse,
	ProductVariant,
} from "@commercetools/platform-sdk";
import type {
	CartAddDiscountCodeAction,
	CustomLineItem,
	DirectDiscount,
} from "@commercetools/platform-sdk/dist/declarations/src/generated/models/cart";
import type { ShippingMethodResourceIdentifier } from "@commercetools/platform-sdk/dist/declarations/src/generated/models/shipping-method";
import { v4 as uuidv4 } from "uuid";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";
import {
	createAddress,
	createCentPrecisionMoney,
	createCustomFields,
	createTypedMoney,
} from "../helpers.ts";
import {
	calculateCartTotalPrice,
	calculateLineItemTotalPrice,
	createCustomLineItemFromDraft,
	createDiscountCodeInfoFromCode,
	selectPrice,
} from "./helpers.ts";
import type { CartRepository } from "./index.ts";

export class CartUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Cart, CartUpdateAction>>
{
	private repository: CartRepository;

	constructor(storage: any, repository: CartRepository) {
		super(storage);
		this.repository = repository;
	}
	addItemShippingAddress(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ action, address }: CartAddItemShippingAddressAction,
	) {
		const newAddress = createAddress(
			address,
			context.projectKey,
			this._storage,
		);
		if (newAddress) {
			resource.itemShippingAddresses.push(newAddress);
		}
	}

	addLineItem(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{
			productId,
			variantId,
			sku,
			custom,
			quantity = 1,
			addedAt,
			key,
		}: CartAddLineItemAction,
	) {
		let product: Product | null = null;

		if (productId && variantId) {
			// Fetch product and variant by ID
			product = this._storage.get(context.projectKey, "product", productId, {});
		} else if (sku) {
			// Fetch product and variant by SKU
			const items = this._storage.query(context.projectKey, "product", {
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
		const variant: ProductVariant | undefined = [
			product.masterData.current.masterVariant,
			...product.masterData.current.variants,
		].find((x) => {
			if (sku) return x.sku === sku;
			if (variantId) return x.id === variantId;
			return false;
		});

		if (!variant) {
			// Check if variant is found
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: sku
					? `A variant with SKU '${sku}' for product '${product.id}' not found.`
					: `A variant with ID '${variantId}' for product '${product.id}' not found.`,
			});
		}

		const alreadyAdded = resource.lineItems.some(
			(x) => x.productId === product?.id && x.variant.id === variant?.id,
		);
		if (alreadyAdded) {
			// increase quantity and update total price
			resource.lineItems.forEach((x) => {
				if (x.productId === product?.id && x.variant.id === variant?.id) {
					x.quantity += quantity;
					x.totalPrice.centAmount = calculateLineItemTotalPrice(x);
				}
			});
		} else {
			// add line item
			if (!variant.prices?.length) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A product with ID '${productId}' doesn't have any prices.`,
				});
			}

			const currency = resource.totalPrice.currencyCode;

			const price = selectPrice({
				prices: variant.prices,
				currency,
				country: resource.country,
			});
			if (!price) {
				throw new Error(
					`No valid price found for ${productId} for country ${resource.country} and currency ${currency}`,
				);
			}
			resource.lineItems.push({
				id: uuidv4(),
				key,
				addedAt: addedAt ? addedAt : new Date().toISOString(),
				productId: product.id,
				productKey: product.key,
				productSlug: product.masterData.current.slug,
				productType: product.productType,
				name: product.masterData.current.name,
				variant,
				price: price,
				taxedPricePortions: [],
				perMethodTaxRate: [],
				totalPrice: {
					...price.value,
					type: "centPrecision",
					centAmount: price.value.centAmount * quantity,
				},
				quantity,
				discountedPricePerQuantity: [],
				lineItemMode: "Standard",
				priceMode: "Platform",
				state: [],
				custom: createCustomFields(custom, context.projectKey, this._storage),
			});
		}

		// Update cart total price
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	changeLineItemQuantity(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ lineItemId, lineItemKey, quantity }: CartChangeLineItemQuantityAction,
	) {
		let lineItem: Writable<LineItem> | undefined;

		if (lineItemId) {
			lineItem = resource.lineItems.find((x) => x.id === lineItemId);
			if (!lineItem) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A line item with ID '${lineItemId}' not found.`,
				});
			}
		} else if (lineItemKey) {
			lineItem = resource.lineItems.find((x) => x.id === lineItemId);
			if (!lineItem) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A line item with Key '${lineItemKey}' not found.`,
				});
			}
		} else {
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: "Either lineItemid or lineItemKey needs to be provided.",
			});
		}

		if (quantity === 0) {
			// delete line item
			resource.lineItems = resource.lineItems.filter(
				(x) => x.id !== lineItemId,
			);
		} else {
			resource.lineItems.forEach((x) => {
				if (x.id === lineItemId && quantity) {
					x.quantity = quantity;
					x.totalPrice.centAmount = calculateLineItemTotalPrice(x);
				}
			});
		}

		// Update cart total price
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	changeTaxRoundingMode(
		_context: RepositoryContext,
		resource: Writable<Cart>,
		{ taxRoundingMode }: CartChangeTaxRoundingModeAction,
	) {
		resource.taxRoundingMode = taxRoundingMode;
	}

	recalculate() {
		// Dummy action when triggering a recalculation of the cart
		//
		// From commercetools documentation:
		// This update action does not set any Cart field in particular,
		// but it triggers several Cart updates to bring prices and discounts to the latest state.
		// Those can become stale over time when no Cart updates have been performed for a while
		// and prices on related Products have changed in the meanwhile.
	}

	addDiscountCode(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ code }: CartAddDiscountCodeAction,
	) {
		const info = createDiscountCodeInfoFromCode(
			context.projectKey,
			this._storage,
			code,
		);
		if (
			!resource.discountCodes
				.map((dc) => dc.discountCode.id)
				.includes(info.discountCode.id)
		) {
			resource.discountCodes.push(info);
		}
	}

	removeDiscountCode(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ discountCode }: CartRemoveDiscountCodeAction,
	) {
		resource.discountCodes = resource.discountCodes.filter(
			(code) => code.discountCode.id !== discountCode.id,
		);
	}

	removeLineItem(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ lineItemId, quantity }: CartRemoveLineItemAction,
	) {
		const lineItem = resource.lineItems.find((x) => x.id === lineItemId);
		if (!lineItem) {
			// Check if product is found
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: `A line item with ID '${lineItemId}' not found.`,
			});
		}

		const shouldDelete = !quantity || quantity >= lineItem.quantity;
		if (shouldDelete) {
			// delete line item
			resource.lineItems = resource.lineItems.filter(
				(x) => x.id !== lineItemId,
			);
		} else {
			// decrease quantity and update total price
			resource.lineItems.forEach((x) => {
				if (x.id === lineItemId && quantity) {
					x.quantity -= quantity;
					x.totalPrice.centAmount = calculateLineItemTotalPrice(x);
				}
			});
		}

		// Update cart total price
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	addCustomLineItem(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{
			money,
			name,
			slug,
			quantity = 1,
			taxCategory,
			custom,
			priceMode = "Standard",
			key,
		}: CartAddCustomLineItemAction,
	) {
		const customLineItem = createCustomLineItemFromDraft(
			context.projectKey,
			{ money, name, slug, quantity, taxCategory, custom, priceMode, key },
			this._storage,
			resource.shippingAddress?.country ?? resource.country,
		);

		resource.customLineItems.push(customLineItem);
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	removeCustomLineItem(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ customLineItemId, customLineItemKey }: CartRemoveCustomLineItemAction,
	) {
		let customLineItem;

		if (!customLineItemId && !customLineItemKey) {
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message:
					"Either customLineItemId or customLineItemKey needs to be provided.",
			});
		}

		if (customLineItemId) {
			customLineItem = resource.customLineItems.find(
				(x) => x.id === customLineItemId,
			);
			if (!customLineItem) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A custom line item with ID '${customLineItemId}' not found.`,
				});
			}
			resource.customLineItems = resource.customLineItems.filter(
				(x) => x.id !== customLineItemId,
			);
		}

		if (customLineItemKey) {
			customLineItem = resource.customLineItems.find(
				(x) => x.key === customLineItemKey,
			);
			if (!customLineItem) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A custom line item with key '${customLineItemKey}' not found.`,
				});
			}
			resource.customLineItems = resource.customLineItems.filter(
				(x) => x.key !== customLineItemKey,
			);
		}

		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	changeCustomLineItemQuantity(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{
			customLineItemId,
			customLineItemKey,
			quantity,
		}: CartChangeCustomLineItemQuantityAction,
	) {
		let customLineItem;

		if (!customLineItemId && !customLineItemKey) {
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message:
					"Either customLineItemId or customLineItemKey needs to be provided.",
			});
		}

		const setQuantity = (
			customLineItem: Writable<CustomLineItem> | undefined,
		) => {
			if (!customLineItem) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A custom line item with ${customLineItemId ? `ID '${customLineItemId}'` : `key '${customLineItemKey}'`} not found.`,
				});
			}
			customLineItem.quantity = quantity;
			customLineItem.totalPrice = createCentPrecisionMoney({
				...customLineItem.money,
				centAmount: (customLineItem.money.centAmount ?? 0) * quantity,
			});
		};

		if (customLineItemId) {
			customLineItem = resource.customLineItems.find(
				(x) => x.id === customLineItemId,
			);
			setQuantity(customLineItem);
		}

		if (customLineItemKey) {
			customLineItem = resource.customLineItems.find(
				(x) => x.key === customLineItemKey,
			);
			setQuantity(customLineItem);
		}

		// Update cart total price
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	changeCustomLineItemMoney(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{
			customLineItemId,
			customLineItemKey,
			money,
		}: CartChangeCustomLineItemMoneyAction,
	) {
		let customLineItem;

		const setMoney = (customLineItem: Writable<CustomLineItem> | undefined) => {
			if (!customLineItem) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A custom line item with ${customLineItemId ? `ID '${customLineItemId}'` : `key '${customLineItemKey}'`} not found.`,
				});
			}
			customLineItem.money = createTypedMoney(money);
			customLineItem.totalPrice = createCentPrecisionMoney({
				...money,
				centAmount: (money.centAmount ?? 0) * customLineItem.quantity,
			});
		};

		if (customLineItemId) {
			customLineItem = resource.customLineItems.find(
				(x) => x.id === customLineItemId,
			);
			setMoney(customLineItem);
		}

		if (customLineItemKey) {
			customLineItem = resource.customLineItems.find(
				(x) => x.key === customLineItemKey,
			);
			setMoney(customLineItem);
		}

		// Update cart total price
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	setAnonymousId(
		_context: RepositoryContext,
		resource: Writable<Cart>,
		{ anonymousId }: CartSetAnonymousIdAction,
	) {
		resource.anonymousId = anonymousId;
		resource.customerId = undefined;
	}

	setBillingAddress(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ address }: CartSetBillingAddressAction,
	) {
		resource.billingAddress = createAddress(
			address,
			context.projectKey,
			this._storage,
		);
	}

	setBillingAddressCustomType(
		context: RepositoryContext,
		resource: Writable<Cart>,
		custom: CartSetBillingAddressCustomTypeAction,
	) {
		if (!resource.billingAddress) {
			throw new Error("Resource has no billing address");
		}

		if (!custom.type) {
			resource.billingAddress.custom = undefined;
			return;
		}

		const resolvedType = this._storage.getByResourceIdentifier<"type">(
			context.projectKey,
			custom.type,
		);

		if (!resolvedType) {
			throw new Error(`Type ${custom.type} not found`);
		}

		resource.billingAddress.custom = {
			type: {
				typeId: "type",
				id: resolvedType.id,
			},
			fields: custom.fields || {},
		};
	}

	setCountry(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ country }: CartSetCountryAction,
	) {
		resource.country = country;
	}

	setCustomerEmail(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ email }: CartSetCustomerEmailAction,
	) {
		resource.customerEmail = email;
	}

	setCustomerId(
		_context: RepositoryContext,
		resource: Writable<Cart>,
		{ customerId }: CartSetCustomerIdAction,
	) {
		resource.anonymousId = undefined;
		resource.customerId = customerId;
	}

	setCustomField(
		context: RepositoryContext,
		resource: Cart,
		{ name, value }: CartSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}

		resource.custom.fields[name] = value;
	}

	setCustomShippingMethod(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{
			shippingMethodName,
			shippingRate,
			taxCategory,
			externalTaxRate,
		}: CartSetCustomShippingMethodAction,
	) {
		if (externalTaxRate) {
			throw new Error("External tax rate is not supported");
		}

		const tax = taxCategory
			? this._storage.getByResourceIdentifier<"tax-category">(
					context.projectKey,
					taxCategory,
				)
			: undefined;

		resource.shippingInfo = {
			shippingMethodName,
			price: createCentPrecisionMoney(shippingRate.price),
			shippingRate: {
				price: createTypedMoney(shippingRate.price),
				tiers: [],
			},
			taxCategory: tax
				? {
						typeId: "tax-category",
						id: tax?.id,
					}
				: undefined,
			shippingMethodState: "MatchesCart",
		};
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ type, fields }: CartSetCustomTypeAction,
	) {
		if (!type) {
			resource.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new Error(`Type ${type} not found`);
			}

			resource.custom = {
				type: {
					typeId: "type",
					id: resolvedType.id,
				},
				fields: fields || {},
			};
		}
	}

	setDirectDiscounts(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ discounts }: CartSetDirectDiscountsAction,
	) {
		// Doesn't apply any discounts logic, just sets the directDiscounts field
		resource.directDiscounts = discounts.map(
			(discount) =>
				({
					...discount,
					id: uuidv4(),
				}) as DirectDiscount,
		);
	}

	setLineItemCustomField(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{
			lineItemId,
			lineItemKey,
			name,
			value,
			action,
		}: CartSetLineItemCustomFieldAction,
	) {
		const lineItem = resource.lineItems.find(
			(x) =>
				(lineItemId && x.id === lineItemId) ||
				(lineItemKey && x.key === lineItemKey),
		);

		if (!lineItem) {
			// Check if line item is found
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: lineItemKey
					? `A line item with key '${lineItemKey}' not found.`
					: `A line item with ID '${lineItemId}' not found.`,
			});
		}

		if (!lineItem.custom) {
			throw new Error("Resource has no custom field");
		}

		lineItem.custom.fields[name] = value;
	}

	setLineItemCustomType(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ lineItemId, lineItemKey, type, fields }: CartSetLineItemCustomTypeAction,
	) {
		const lineItem = resource.lineItems.find(
			(x) =>
				(lineItemId && x.id === lineItemId) ||
				(lineItemKey && x.key === lineItemKey),
		);

		if (!lineItem) {
			// Check if line item is found
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: lineItemKey
					? `A line item with key '${lineItemKey}' not found.`
					: `A line item with ID '${lineItemId}' not found.`,
			});
		}

		if (!type) {
			lineItem.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new Error(`Type ${type} not found`);
			}

			lineItem.custom = {
				type: {
					typeId: "type",
					id: resolvedType.id,
				},
				fields: fields || {},
			};
		}
	}

	setLineItemPrice(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ lineItemId, lineItemKey, externalPrice }: CartSetLineItemPriceAction,
	) {
		const lineItem = resource.lineItems.find(
			(x) =>
				(lineItemId && x.id === lineItemId) ||
				(lineItemKey && x.key === lineItemKey),
		);

		if (!lineItem) {
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: lineItemKey
					? `A line item with key '${lineItemKey}' not found.`
					: `A line item with ID '${lineItemId}' not found.`,
			});
		}

		if (!externalPrice && lineItem.priceMode !== "ExternalPrice") {
			return;
		}

		if (
			externalPrice &&
			externalPrice.currencyCode !== resource.totalPrice.currencyCode
		) {
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: `Currency mismatch. Expected '${resource.totalPrice.currencyCode}' but got '${externalPrice.currencyCode}'.`,
			});
		}

		if (externalPrice) {
			lineItem.priceMode = "ExternalPrice";
			const priceValue = createTypedMoney(externalPrice);

			lineItem.price = lineItem.price ?? { id: uuidv4() };
			lineItem.price.value = priceValue;
		} else {
			lineItem.priceMode = "Platform";

			const price = selectPrice({
				prices: lineItem.variant.prices,
				currency: resource.totalPrice.currencyCode,
				country: resource.country,
			});

			if (!price) {
				throw new Error(
					`No valid price found for ${lineItem.productId} for country ${resource.country} and currency ${resource.totalPrice.currencyCode}`,
				);
			}

			lineItem.price = price;
		}

		const lineItemTotal = calculateLineItemTotalPrice(lineItem);
		lineItem.totalPrice = createCentPrecisionMoney({
			...lineItem.price!.value,
			centAmount: lineItemTotal,
		});
		resource.totalPrice.centAmount = calculateCartTotalPrice(resource);
	}

	setLineItemShippingDetails(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{
			action,
			shippingDetails,
			lineItemId,
			lineItemKey,
		}: CartSetLineItemShippingDetailsAction,
	) {
		const lineItem = resource.lineItems.find(
			(x) =>
				(lineItemId && x.id === lineItemId) ||
				(lineItemKey && x.key === lineItemKey),
		);

		if (!lineItem) {
			// Check if line item is found
			throw new CommercetoolsError<GeneralError>({
				code: "General",
				message: lineItemKey
					? `A line item with key '${lineItemKey}' not found.`
					: `A line item with ID '${lineItemId}' not found.`,
			});
		}

		lineItem.shippingDetails = {
			...shippingDetails,
			valid: true,
		} as ItemShippingDetails;
	}

	setLocale(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ locale }: CartSetLocaleAction,
	) {
		resource.locale = locale;
	}

	setShippingAddress(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ address }: CartSetShippingAddressAction,
	) {
		if (!address) {
			resource.shippingAddress = undefined;
			return;
		}

		let custom: CustomFields | undefined;
		if ((address as Address & AddressDraft).custom) {
			custom = createCustomFields(
				(address as Address & AddressDraft).custom,
				context.projectKey,
				this._storage,
			);
		}

		resource.shippingAddress = {
			...address,
			custom: custom,
		};
	}

	setShippingAddressCustomType(
		context: RepositoryContext,
		resource: Writable<Cart>,
		custom: CartSetShippingAddressCustomTypeAction,
	) {
		if (!resource.shippingAddress) {
			throw new Error("Resource has no shipping address");
		}

		if (!custom.type) {
			resource.shippingAddress.custom = undefined;
			return;
		}

		const resolvedType = this._storage.getByResourceIdentifier<"type">(
			context.projectKey,
			custom.type,
		);

		if (!resolvedType) {
			throw new Error(`Type ${custom.type} not found`);
		}

		resource.shippingAddress.custom = {
			type: {
				typeId: "type",
				id: resolvedType.id,
			},
			fields: custom.fields || {},
		};
	}

	setShippingMethod(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ shippingMethod }: CartSetShippingMethodAction,
	) {
		if (shippingMethod) {
			resource.shippingInfo = this.repository.createShippingInfo(
				context,
				resource,
				shippingMethod,
			);
		} else {
			resource.shippingInfo = undefined;
		}
	}

	setShippingAddressCustomField(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ name, value }: CartSetShippingAddressCustomFieldAction,
	) {
		if (!resource.shippingAddress) {
			throw new Error("Resource has no shipping address");
		}
		if (!resource.shippingAddress.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.shippingAddress.custom.fields[name] = value;
	}

	removeShippingMethod(
		context: RepositoryContext,
		resource: Writable<Cart>,
		{ shippingKey }: CartRemoveShippingMethodAction,
	) {
		if (!resource.shippingInfo) {
			return;
		}
		const shippingMethod =
			this._storage.getByResourceIdentifier<"shipping-method">(
				context.projectKey,
				{
					typeId: "shipping-method",
					key: shippingKey,
				} as ShippingMethodResourceIdentifier,
			);

		if (resource.shippingInfo?.shippingMethod?.id !== shippingMethod.id) {
			throw new Error("Shipping method with key not found");
		}

		resource.shippingInfo = undefined;
	}
}
