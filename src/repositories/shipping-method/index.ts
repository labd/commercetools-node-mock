import {
	type ShippingMethod,
	type ShippingMethodDraft,
	type ZoneRate,
	type ZoneRateDraft,
	type ZoneReference,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../../helpers";
import { getShippingMethodsMatchingCart } from "../../shipping";
import type { AbstractStorage } from "../../storage/abstract";
import type { GetParams, RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
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
