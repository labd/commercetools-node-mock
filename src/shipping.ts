import type {
	Cart,
	CartValueTier,
	CentPrecisionMoney,
	InvalidOperationError,
	MissingTaxRateForCountryError,
	ShippingInfo,
	ShippingMethod,
	ShippingRate,
	ShippingRatePriceTier,
	TaxedItemPrice,
	TaxPortion,
} from "@commercetools/platform-sdk";
import { Decimal } from "decimal.js";
import { CommercetoolsError } from "./exceptions.ts";
import type { GetParams, RepositoryContext } from "./repositories/abstract.ts";
import {
	createCentPrecisionMoney,
	roundDecimal,
} from "./repositories/helpers.ts";
import type { AbstractStorage } from "./storage/abstract.ts";

export const markMatchingShippingRate = (
	cart: Cart,
	shippingRate: ShippingRate,
): ShippingRate => {
	const isMatching =
		shippingRate.price.currencyCode === cart.totalPrice.currencyCode;
	return {
		...shippingRate,
		tiers: markMatchingShippingRatePriceTiers(cart, shippingRate.tiers),
		isMatching: isMatching,
	};
};

export const markMatchingShippingRatePriceTiers = (
	cart: Cart,
	tiers: ShippingRatePriceTier[],
): ShippingRatePriceTier[] => {
	if (tiers.length === 0) {
		return [];
	}

	if (new Set(tiers.map((tier) => tier.type)).size > 1) {
		throw new Error("Can't handle multiple types of tiers");
	}

	const tierType = tiers[0].type;
	switch (tierType) {
		case "CartValue":
			return markMatchingCartValueTiers(cart, tiers as CartValueTier[]);
		// case 'CartClassification':
		// 	return markMatchingCartClassificationTiers(cart, tiers)
		// case 'CartScore':
		// 	return markMatchingCartScoreTiers(cart, tiers)
		default:
			throw new Error(`Unsupported tier type: ${tierType}`);
	}
};

const markMatchingCartValueTiers = (
	cart: Cart,
	tiers: readonly CartValueTier[],
): ShippingRatePriceTier[] => {
	// Sort tiers from high to low since we only want to match the highest tier
	const sortedTiers = [...tiers].sort(
		(a, b) => b.minimumCentAmount - a.minimumCentAmount,
	);

	// Find the first tier that matches the cart and set the flag. We push
	// the results into a map so that we can output the tiers in the same order as
	// we received them.
	const result: Record<number, ShippingRatePriceTier> = {};
	let hasMatchingTier = false;
	for (const tier of sortedTiers) {
		const isMatching =
			!hasMatchingTier &&
			cart.totalPrice.currencyCode === tier.price.currencyCode &&
			cart.totalPrice.centAmount >= tier.minimumCentAmount;

		if (isMatching) hasMatchingTier = true;
		result[tier.minimumCentAmount] = {
			...tier,
			isMatching: isMatching,
		};
	}

	return tiers.map((tier) => result[tier.minimumCentAmount]);
};

/*
 * Retrieves all the ShippingMethods that can ship to the shipping address of
 * the given Cart. Each ShippingMethod contains exactly one ShippingRate with
 * the flag isMatching set to true. This ShippingRate is used when the
 * ShippingMethod is added to the Cart.
 */
export const getShippingMethodsMatchingCart = (
	context: RepositoryContext,
	storage: AbstractStorage,
	cart: Cart,
	params: GetParams = {},
) => {
	if (!cart.shippingAddress?.country) {
		throw new CommercetoolsError<InvalidOperationError>({
			code: "InvalidOperation",
			message: `The cart with ID '${cart.id}' does not have a shipping address set.`,
		});
	}

	// Get all shipping methods that have a zone that matches the shipping address
	const zones = storage.query<"zone">(context.projectKey, "zone", {
		where: [`locations(country="${cart.shippingAddress.country}"))`],
		limit: 100,
	});
	const zoneIds = zones.results.map((zone) => zone.id);
	const shippingMethods = storage.query<"shipping-method">(
		context.projectKey,
		"shipping-method",
		{
			where: [
				"zoneRates(zone(id in (:zoneIds)))",
				`zoneRates(shippingRates(price(currencyCode="${cart.totalPrice.currencyCode}")))`,
			],
			"var.zoneIds": zoneIds,
			expand: params.expand,
		},
	);

	// Make sure that each shipping method has exactly one shipping rate and
	// that the shipping rate is marked as matching
	const results = shippingMethods.results
		.map((shippingMethod) => {
			// Iterate through the zoneRates, process the shipping rates and filter
			// out all zoneRates which have no matching shipping rates left
			const rates = shippingMethod.zoneRates
				.map((zoneRate) => ({
					zone: zoneRate.zone,

					// Iterate through the shippingRates and mark the matching ones
					// then we filter out the non-matching ones
					shippingRates: zoneRate.shippingRates
						.map((rate) => markMatchingShippingRate(cart, rate))
						.filter((rate) => rate.isMatching),
				}))
				.filter((zoneRate) => zoneRate.shippingRates.length > 0);

			return {
				...shippingMethod,
				zoneRates: rates,
			};
		})
		.filter((shippingMethod) => shippingMethod.zoneRates.length > 0);

	return {
		...shippingMethods,
		results: results,
	};
};

/**
 * Interface for cart-like objects that can be used for shipping calculations
 */
interface ShippingCalculationSource {
	id: string;
	totalPrice: CentPrecisionMoney;
	shippingAddress?: {
		country: string;
		[key: string]: any;
	};
	taxRoundingMode?: string;
}

/**
 * Creates shipping info from a shipping method, handling all tax calculations and pricing logic.
 */
export const createShippingInfoFromMethod = (
	context: RepositoryContext,
	storage: AbstractStorage,
	resource: ShippingCalculationSource,
	method: ShippingMethod,
): Omit<ShippingInfo, "deliveries"> => {
	const country = resource.shippingAddress!.country;

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

	const taxCategory = storage.getByResourceIdentifier<"tax-category">(
		context.projectKey,
		method.taxCategory,
	);

	// TODO: match state in addition to country
	const taxRate = taxCategory.rates.find((rate) => rate.country === country);

	if (!taxRate) {
		throw new CommercetoolsError<MissingTaxRateForCountryError>({
			code: "MissingTaxRateForCountry",
			message: `Tax category '${taxCategory.id}' is missing a tax rate for country '${country}'.`,
			taxCategoryId: taxCategory.id,
		});
	}

	const shippingRateTier = shippingRate.tiers.find((tier) => tier.isMatching);
	if (shippingRateTier && shippingRateTier.type !== "CartValue") {
		throw new Error("Non-CartValue shipping rate tier is not supported");
	}

	let shippingPrice = shippingRateTier
		? createCentPrecisionMoney(shippingRateTier.price)
		: shippingRate.price;

	// Handle freeAbove: if total is above the freeAbove threshold, shipping is free
	if (
		shippingRate.freeAbove &&
		shippingRate.freeAbove.currencyCode === resource.totalPrice.currencyCode &&
		resource.totalPrice.centAmount >= shippingRate.freeAbove.centAmount
	) {
		shippingPrice = {
			...shippingPrice,
			centAmount: 0,
		};
	}

	// Calculate tax amounts
	const totalGross: CentPrecisionMoney = taxRate.includedInPrice
		? shippingPrice
		: {
				...shippingPrice,
				centAmount: roundDecimal(
					new Decimal(shippingPrice.centAmount).mul(1 + taxRate.amount),
					resource.taxRoundingMode || "HalfEven",
				).toNumber(),
			};

	const totalNet: CentPrecisionMoney = taxRate.includedInPrice
		? {
				...shippingPrice,
				centAmount: roundDecimal(
					new Decimal(shippingPrice.centAmount).div(1 + taxRate.amount),
					resource.taxRoundingMode || "HalfEven",
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

	return {
		shippingMethod: {
			typeId: "shipping-method" as const,
			id: method.id,
		},
		shippingMethodName: method.name,
		price: shippingPrice,
		shippingRate,
		taxedPrice,
		taxRate,
		taxCategory: method.taxCategory,
		shippingMethodState: "MatchesCart",
	};
};
