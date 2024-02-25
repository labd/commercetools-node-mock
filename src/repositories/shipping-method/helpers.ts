import { ShippingRate, ShippingRateDraft } from "@commercetools/platform-sdk";
import { createTypedMoney } from "../helpers";

export const transformShippingRate = (
	rate: ShippingRateDraft,
): ShippingRate => ({
	price: createTypedMoney(rate.price),
	freeAbove: rate.freeAbove && createTypedMoney(rate.freeAbove),
	tiers: rate.tiers || [],
});
