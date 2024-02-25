import {
	Cart,
	CartValueTier,
	ShippingRate,
	ShippingRatePriceTier,
} from "@commercetools/platform-sdk";

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
