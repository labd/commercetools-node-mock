import type {
	ShippingMethod,
	ShippingMethodDraft,
	ZoneRate,
	ZoneRateDraft,
	ZoneReference,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../../helpers.ts";
import { getShippingMethodsMatchingCart } from "../../shipping.ts";
import type { GetParams, RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers.ts";
import { ShippingMethodUpdateHandler } from "./actions.ts";
import { transformShippingRate } from "./helpers.ts";

export class ShippingMethodRepository extends AbstractResourceRepository<"shipping-method"> {
	constructor(config: Config) {
		super("shipping-method", config);
		this.actions = new ShippingMethodUpdateHandler(config.storage);
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

		return getShippingMethodsMatchingCart(context, this._storage, cart, params);
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
