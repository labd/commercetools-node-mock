import type {
	Cart,
	CartValueTier,
	InvalidOperationError,
	ShippingRate,
	ShippingRatePriceTier,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "./exceptions";
import type { GetParams, RepositoryContext } from "./repositories/abstract";
import type { AbstractStorage } from "./storage/abstract";

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
