import { isDeepStrictEqual } from "node:util";
import type {
	ShippingMethod,
	ShippingMethodAddShippingRateAction,
	ShippingMethodAddStoreAction,
	ShippingMethodAddZoneAction,
	ShippingMethodChangeActiveAction,
	ShippingMethodChangeIsDefaultAction,
	ShippingMethodChangeNameAction,
	ShippingMethodChangeTaxCategoryAction,
	ShippingMethodRemoveShippingRateAction,
	ShippingMethodRemoveStoreAction,
	ShippingMethodRemoveZoneAction,
	ShippingMethodSetCustomFieldAction,
	ShippingMethodSetCustomTypeAction,
	ShippingMethodSetDescriptionAction,
	ShippingMethodSetKeyAction,
	ShippingMethodSetLocalizedDescriptionAction,
	ShippingMethodSetLocalizedNameAction,
	ShippingMethodSetPredicateAction,
	ShippingMethodSetStoresAction,
	ShippingMethodUpdateAction,
	ZoneReference,
} from "@commercetools/platform-sdk";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler } from "../abstract.ts";
import {
	getReferenceFromResourceIdentifier,
	getStoreKeyReference,
} from "../helpers.ts";
import { transformShippingRate } from "./helpers.ts";

export class ShippingMethodUpdateHandler
	extends AbstractUpdateHandler
	implements UpdateHandlerInterface<ShippingMethod, ShippingMethodUpdateAction>
{
	changeTaxCategory: (
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		action: ShippingMethodChangeTaxCategoryAction,
	) => void;

	addShippingRate(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ shippingRate, zone }: ShippingMethodAddShippingRateAction,
	) {
		const rate = transformShippingRate(shippingRate);

		resource.zoneRates.forEach((zoneRate) => {
			if (zoneRate.zone.id === zone.id) {
				zoneRate.shippingRates.push(rate);
				return;
			}
		});
		resource.zoneRates.push({
			zone: {
				typeId: "zone",
				id: zone.id!,
			},
			shippingRates: [rate],
		});
	}

	async addZone(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ zone }: ShippingMethodAddZoneAction,
	) {
		const zoneReference =
			await getReferenceFromResourceIdentifier<ZoneReference>(
				zone,
				context.projectKey,
				this._storage,
			);

		if (resource.zoneRates === undefined) {
			resource.zoneRates = [];
		}

		resource.zoneRates.push({
			zone: zoneReference,
			shippingRates: [],
		});
	}

	changeActive(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ active }: ShippingMethodChangeActiveAction,
	) {
		resource.active = active;
	}

	changeIsDefault(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ isDefault }: ShippingMethodChangeIsDefaultAction,
	) {
		resource.isDefault = isDefault;
	}

	changeName(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ name }: ShippingMethodChangeNameAction,
	) {
		resource.name = name;
	}

	removeShippingRate(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ shippingRate, zone }: ShippingMethodRemoveShippingRateAction,
	) {
		const rate = transformShippingRate(shippingRate);

		resource.zoneRates.forEach((zoneRate) => {
			if (zoneRate.zone.id === zone.id) {
				zoneRate.shippingRates = zoneRate.shippingRates.filter(
					(otherRate) => !isDeepStrictEqual(rate, otherRate),
				);
			}
		});
	}

	async addStore(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ store }: ShippingMethodAddStoreAction,
	) {
		const reference = await getStoreKeyReference(
			store,
			context.projectKey,
			this._storage,
		);
		if (!resource.stores.some((s) => s.key === reference.key)) {
			resource.stores.push(reference);
		}
	}

	async removeStore(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ store }: ShippingMethodRemoveStoreAction,
	) {
		const reference = await getStoreKeyReference(
			store,
			context.projectKey,
			this._storage,
		);
		resource.stores = resource.stores.filter((s) => s.key !== reference.key);
	}

	async setStores(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ stores }: ShippingMethodSetStoresAction,
	) {
		resource.stores = stores
			? await Promise.all(
					stores.map((s) =>
						getStoreKeyReference(s, context.projectKey, this._storage),
					),
				)
			: [];
	}

	removeZone(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ zone }: ShippingMethodRemoveZoneAction,
	) {
		resource.zoneRates = resource.zoneRates.filter(
			(zoneRate) => zoneRate.zone.id !== zone.id,
		);
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ name, value }: ShippingMethodSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ type, fields }: ShippingMethodSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	setDescription(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ description }: ShippingMethodSetDescriptionAction,
	) {
		resource.description = description;
	}

	setKey(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ key }: ShippingMethodSetKeyAction,
	) {
		resource.key = key;
	}

	setLocalizedDescription(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ localizedDescription }: ShippingMethodSetLocalizedDescriptionAction,
	) {
		resource.localizedDescription = localizedDescription;
	}

	setLocalizedName(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ localizedName }: ShippingMethodSetLocalizedNameAction,
	) {
		resource.localizedName = localizedName;
	}

	setPredicate(
		_context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ predicate }: ShippingMethodSetPredicateAction,
	) {
		resource.predicate = predicate;
	}
}
