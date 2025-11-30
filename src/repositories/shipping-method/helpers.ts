import type {
	ShippingRate,
	ShippingRateDraft,
} from "@commercetools/platform-sdk";
import { createTypedMoney } from "../helpers.ts";

export const transformShippingRate = (
	rate: ShippingRateDraft,
): ShippingRate => ({
	price: createTypedMoney(rate.price),
	freeAbove: rate.freeAbove && createTypedMoney(rate.freeAbove),
	tiers: rate.tiers || [],
});
