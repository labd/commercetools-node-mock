import {
	ShippingMethodChangeTaxCategoryAction,
	ShippingMethodRemoveShippingRateAction,
	type ShippingMethod,
	type ShippingMethodAddShippingRateAction,
	type ShippingMethodAddZoneAction,
	type ShippingMethodChangeActiveAction,
	type ShippingMethodChangeIsDefaultAction,
	type ShippingMethodChangeNameAction,
	type ShippingMethodRemoveZoneAction,
	type ShippingMethodSetCustomFieldAction,
	type ShippingMethodSetCustomTypeAction,
	type ShippingMethodSetDescriptionAction,
	type ShippingMethodSetKeyAction,
	type ShippingMethodSetLocalizedDescriptionAction,
	type ShippingMethodSetLocalizedNameAction,
	type ShippingMethodSetPredicateAction,
	type ShippingMethodUpdateAction,
	type ZoneReference,
} from "@commercetools/platform-sdk";
import deepEqual from "deep-equal";
import type { Writable } from "~src/types";
import {
	AbstractUpdateHandler,
	RepositoryContext,
	UpdateHandlerInterface,
} from "../abstract";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers";
import { transformShippingRate } from "./helpers";

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

	addZone(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ zone }: ShippingMethodAddZoneAction,
	) {
		const zoneReference = getReferenceFromResourceIdentifier<ZoneReference>(
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
					(otherRate) => !deepEqual(rate, otherRate),
				);
			}
		});
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
		if (!resource.custom) {
			return;
		}
		if (value === null) {
			delete resource.custom.fields[name];
		} else {
			resource.custom.fields[name] = value;
		}
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<ShippingMethod>,
		{ type, fields }: ShippingMethodSetCustomTypeAction,
	) {
		if (type) {
			resource.custom = createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		} else {
			resource.custom = undefined;
		}
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
