import type {
	CartSetAnonymousIdAction,
	CartSetCustomerIdAction,
	CartUpdateAction,
	CentPrecisionMoney,
	InvalidOperationError,
	MissingTaxRateForCountryError,
	ShippingMethodDoesNotMatchCartError,
} from "@commercetools/platform-sdk";
import type {
	Address,
	AddressDraft,
	Cart,
	CartAddItemShippingAddressAction,
	CartAddLineItemAction,
	CartChangeLineItemQuantityAction,
	CartChangeTaxRoundingModeAction,
	CartRemoveDiscountCodeAction,
	CartRemoveLineItemAction,
	CartRemoveShippingMethodAction,
	CartSetBillingAddressAction,
	CartSetBillingAddressCustomTypeAction,
	CartSetCountryAction,
	CartSetCustomFieldAction,
	CartSetCustomShippingMethodAction,
	CartSetCustomTypeAction,
	CartSetCustomerEmailAction,
	CartSetDirectDiscountsAction,
	CartSetLineItemShippingDetailsAction,
	CartSetLocaleAction,
	CartSetShippingAddressAction,
	CartSetShippingAddressCustomFieldAction,
	CartSetShippingAddressCustomTypeAction,
	CartSetShippingMethodAction,
	CustomFields,
	GeneralError,
	ItemShippingDetails,
	LineItem,
	Product,
	ProductPagedQueryResponse,
	ProductVariant,
} from "@commercetools/platform-sdk";
import type {
	DirectDiscount,
	TaxPortion,
	TaxedItemPrice,
} from "@commercetools/platform-sdk/dist/declarations/src/generated/models/cart";
import type { ShippingMethodResourceIdentifier } from "@commercetools/platform-sdk/dist/declarations/src/generated/models/shipping-method";
import { Decimal } from "decimal.js/decimal";
import { v4 as uuidv4 } from "uuid";
import { CommercetoolsError } from "~src/exceptions";
import { getShippingMethodsMatchingCart } from "~src/shipping";
import type { Writable } from "~src/types";
import type { UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract";
import {
	createAddress,
	createCentPrecisionMoney,
	createCustomFields,
	createTypedMoney,
	roundDecimal,
} from "../helpers";
import {
	calculateCartTotalPrice,
	calculateLineItemTotalPrice,
	selectPrice,
} from "./helpers";

export class CartUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Cart, CartUpdateAction>>
{
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

		let custom: CustomFields | undefined = undefined;
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
			if (resource.taxMode === "External") {
				throw new Error("External tax rate is not supported");
			}

			const country = resource.shippingAddress?.country;

			if (!country) {
				throw new CommercetoolsError<InvalidOperationError>({
					code: "InvalidOperation",
					message: `The cart with ID '${resource.id}' does not have a shipping address set.`,
				});
			}

			// Bit of a hack: calling this checks that the resource identifier is
			// valid (i.e. id xor key) and that the shipping method exists.
			this._storage.getByResourceIdentifier<"shipping-method">(
				context.projectKey,
				shippingMethod,
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
				shippingMethod.id
					? candidate.id === shippingMethod.id
					: candidate.key === shippingMethod.key,
			);

			// Not finding the method in the results means it's not allowed, since
			// getShippingMethodsMatchingCart only returns allowed methods and we
			// already checked that the method exists.
			if (!method) {
				throw new CommercetoolsError<ShippingMethodDoesNotMatchCartError>({
					code: "ShippingMethodDoesNotMatchCart",
					message: `The shipping method with ${shippingMethod.id ? `ID '${shippingMethod.id}'` : `key '${shippingMethod.key}'`} is not allowed for the cart with ID '${resource.id}'.`,
				});
			}

			const taxCategory = this._storage.getByResourceIdentifier<"tax-category">(
				context.projectKey,
				method.taxCategory,
			);

			// TODO: match state in addition to country
			const taxRate = taxCategory.rates.find(
				(rate) => rate.country === country,
			);

			if (!taxRate) {
				throw new CommercetoolsError<MissingTaxRateForCountryError>({
					code: "MissingTaxRateForCountry",
					message: `Tax category '${taxCategory.id}' is missing a tax rate for country '${country}'.`,
					taxCategoryId: taxCategory.id,
				});
			}

			// There should only be one zone rate matching the address, since
			// Locations cannot be assigned to more than one zone.
			// See https://docs.commercetools.com/api/projects/zones#location
			const zoneRate = method.zoneRates.find((rate) =>
				rate.zone.obj?.locations.some((loc) => loc.country === country),
			);

			if (!zoneRate) {
				// This shouldn't happen because getShippingMethodsMatchingCart already
				// filtered out shipping methods without any zones matching the address
				throw new Error("Zone rate not found");
			}

			// Shipping rates are defined by currency, and getShippingMethodsMatchingCart
			// also matches on currency, so there should only be one in the array.
			// See https://docs.commercetools.com/api/projects/shippingMethods#zonerate
			const shippingRate = zoneRate.shippingRates[0];
			if (!shippingRate) {
				// This shouldn't happen because getShippingMethodsMatchingCart already
				// filtered out shipping methods without any matching rates
				throw new Error("Shipping rate not found");
			}

			const shippingRateTier = shippingRate.tiers.find(
				(tier) => tier.isMatching,
			);
			if (shippingRateTier && shippingRateTier.type !== "CartValue") {
				throw new Error("Non-CartValue shipping rate tier is not supported");
			}

			const shippingPrice = shippingRateTier
				? createCentPrecisionMoney(shippingRateTier.price)
				: shippingRate.price;

			// TODO: handle freeAbove

			const totalGross: CentPrecisionMoney = taxRate.includedInPrice
				? shippingPrice
				: {
						...shippingPrice,
						centAmount: roundDecimal(
							new Decimal(shippingPrice.centAmount).mul(1 + taxRate.amount),
							resource.taxRoundingMode,
						).toNumber(),
					};

			const totalNet: CentPrecisionMoney = taxRate.includedInPrice
				? {
						...shippingPrice,
						centAmount: roundDecimal(
							new Decimal(shippingPrice.centAmount).div(1 + taxRate.amount),
							resource.taxRoundingMode,
						).toNumber(),
					}
				: shippingPrice;

			const taxPortions: TaxPortion[] = [
				{
					name: taxRate.name,
					rate: taxRate.amount,
					amount: {
						...shippingPrice,
						centAmount: totalGross.centAmount - totalNet.centAmount,
					},
				},
			];

			const totalTax: CentPrecisionMoney = {
				...shippingPrice,
				centAmount: taxPortions.reduce(
					(acc, portion) => acc + portion.amount.centAmount,
					0,
				),
			};

			const taxedPrice: TaxedItemPrice = {
				totalNet,
				totalGross,
				taxPortions,
				totalTax,
			};

			// @ts-ignore
			resource.shippingInfo = {
				shippingMethod: {
					typeId: "shipping-method",
					id: method.id,
				},
				shippingMethodName: method.name,
				price: shippingPrice,
				shippingRate,
				taxedPrice,
				taxRate,
				taxCategory: method.taxCategory,
			};
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
				{ key: shippingKey } as ShippingMethodResourceIdentifier,
			);

		if (resource.shippingInfo?.shippingMethod?.id !== shippingMethod.id) {
			throw new Error("Shipping method with key not found");
		}

		resource.shippingInfo = undefined;
	}
}
