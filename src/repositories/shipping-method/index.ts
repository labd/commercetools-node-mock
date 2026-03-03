import type {
	ShippingMethod,
	ShippingMethodDraft,
	ZoneRate,
	ZoneRateDraft,
	ZoneReference,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { ShippingMethodDraftSchema } from "#src/schemas/generated/shipping-method.ts";
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
		this.draftSchema = ShippingMethodDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: ShippingMethodDraft,
	): Promise<ShippingMethod> {
		const zoneRates = draft.zoneRates
			? await Promise.all(
					draft.zoneRates.map((z) => this._transformZoneRateDraft(context, z)),
				)
			: [];

		const resource: ShippingMethod = {
			...getBaseResourceProperties(context.clientId),
			...draft,
			active: draft.active ?? true,
			taxCategory: await getReferenceFromResourceIdentifier(
				draft.taxCategory,
				context.projectKey,
				this._storage,
			),
			zoneRates,
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return await this.saveNew(context, resource);
	}

	/*
	 * Retrieves all the ShippingMethods that can ship to the shipping address of
	 * the given Cart. Each ShippingMethod contains exactly one ShippingRate with
	 * the flag isMatching set to true. This ShippingRate is used when the
	 * ShippingMethod is added to the Cart.
	 */
	public async matchingCart(
		context: RepositoryContext,
		cartId: string,
		params: GetParams = {},
	) {
		const cart = await this._storage.get(context.projectKey, "cart", cartId);
		if (!cart) {
			return undefined;
		}

		return await getShippingMethodsMatchingCart(
			context,
			this._storage,
			cart,
			params,
		);
	}

	private async _transformZoneRateDraft(
		context: RepositoryContext,
		draft: ZoneRateDraft,
	): Promise<ZoneRate> {
		return {
			...draft,
			zone: await getReferenceFromResourceIdentifier<ZoneReference>(
				draft.zone,
				context.projectKey,
				this._storage,
			),
			shippingRates: draft.shippingRates?.map(transformShippingRate),
		};
	}
}
