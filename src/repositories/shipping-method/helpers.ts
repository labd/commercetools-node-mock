import type {
	ShippingRate,
	ShippingRateDraft,
} from "@commercetools/platform-sdk";
import { createCentPrecisionMoney } from "../helpers.ts";

export const transformShippingRate = (
	rate: ShippingRateDraft,
): ShippingRate => ({
	price: createCentPrecisionMoney(rate.price),
	freeAbove: rate.freeAbove && createCentPrecisionMoney(rate.freeAbove),
	tiers: rate.tiers || [],
});
