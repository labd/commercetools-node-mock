import {
	InvalidOperationError,
	type ShippingMethod,
	type ShippingMethodDraft,
	type ZoneRate,
	type ZoneRateDraft,
	type ZoneReference,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import { getBaseResourceProperties } from "../../helpers";
import { markMatchingShippingRate } from "../../shippingCalculator";
import { AbstractStorage } from "../../storage/abstract";
import {
	AbstractResourceRepository,
	GetParams,
	RepositoryContext,
} from "../abstract";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers";
import { ShippingMethodUpdateHandler } from "./actions";
import { transformShippingRate } from "./helpers";

export class ShippingMethodRepository extends AbstractResourceRepository<"shipping-method"> {
	constructor(storage: AbstractStorage) {
		super("shipping-method", storage);
		this.actions = new ShippingMethodUpdateHandler(storage);
	}

	create(
		context: RepositoryContext,
		draft: ShippingMethodDraft,
	): ShippingMethod {
		const resource: ShippingMethod = {
			...getBaseResourceProperties(),
			...draft,
			active: draft.active ?? true,
			taxCategory: getReferenceFromResourceIdentifier(
				draft.taxCategory,
				context.projectKey,
				this._storage,
			),
			zoneRates: draft.zoneRates?.map((z) =>
				this._transformZoneRateDraft(context, z),
			),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}

	/*
	 * Retrieves all the ShippingMethods that can ship to the shipping address of
	 * the given Cart. Each ShippingMethod contains exactly one ShippingRate with
	 * the flag isMatching set to true. This ShippingRate is used when the
	 * ShippingMethod is added to the Cart.
	 */
	public matchingCart(
		context: RepositoryContext,
		cartId: string,
		params: GetParams = {},
	) {
		const cart = this._storage.get(context.projectKey, "cart", cartId);
		if (!cart) {
			return undefined;
		}

		if (!cart.shippingAddress?.country) {
			throw new CommercetoolsError<InvalidOperationError>({
				code: "InvalidOperation",
				message: `The cart with ID '${cart.id}' does not have a shipping address set.`,
			});
		}

		// Get all shipping methods that have a zone that matches the shipping address
		const zones = this._storage.query<"zone">(context.projectKey, "zone", {
			where: [`locations(country="${cart.shippingAddress.country}"))`],
			limit: 100,
		});
		const zoneIds = zones.results.map((zone) => zone.id);
		const shippingMethods = this.query(context, {
			"where": [
				`zoneRates(zone(id in (:zoneIds)))`,
				`zoneRates(shippingRates(price(currencyCode="${cart.totalPrice.currencyCode}")))`,
			],
			"var.zoneIds": zoneIds,
			"expand": params.expand,
		});

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
	}

	private _transformZoneRateDraft(
		context: RepositoryContext,
		draft: ZoneRateDraft,
	): ZoneRate {
		return {
			...draft,
			zone: getReferenceFromResourceIdentifier<ZoneReference>(
				draft.zone,
				context.projectKey,
				this._storage,
			),
			shippingRates: draft.shippingRates?.map(transformShippingRate),
		};
	}
}
