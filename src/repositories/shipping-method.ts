import {
	InvalidOperationError,
	type ShippingMethod,
	type ShippingMethodAddShippingRateAction,
	type ShippingMethodAddZoneAction,
	type ShippingMethodChangeIsDefaultAction,
	type ShippingMethodChangeNameAction,
	type ShippingMethodDraft,
	type ShippingMethodRemoveZoneAction,
	type ShippingMethodSetCustomFieldAction,
	type ShippingMethodSetCustomTypeAction,
	type ShippingMethodSetDescriptionAction,
	type ShippingMethodSetKeyAction,
	type ShippingMethodSetLocalizedDescriptionAction,
	type ShippingMethodSetLocalizedNameAction,
	type ShippingMethodSetPredicateAction,
	type ShippingMethodUpdateAction,
	type ShippingRate,
	type ShippingRateDraft,
	type ZoneRate,
	type ZoneRateDraft,
	type ZoneReference,
} from "@commercetools/platform-sdk";
import deepEqual from "deep-equal";
import { CommercetoolsError } from "../exceptions";
import { getBaseResourceProperties } from "../helpers";
import { markMatchingShippingRate } from "../shippingCalculator";
import type { Writable } from "../types";
import {
	AbstractResourceRepository,
	GetParams,
	RepositoryContext,
} from "./abstract";
import {
	createCustomFields,
	createTypedMoney,
	getReferenceFromResourceIdentifier,
} from "./helpers";

export class ShippingMethodRepository extends AbstractResourceRepository<"shipping-method"> {
	getTypeId() {
		return "shipping-method" as const;
	}

	create(
		context: RepositoryContext,
		draft: ShippingMethodDraft,
	): ShippingMethod {
		const resource: ShippingMethod = {
			...getBaseResourceProperties(),
			...draft,
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

	private _transformZoneRateDraft = (
		context: RepositoryContext,
		draft: ZoneRateDraft,
	): ZoneRate => ({
		...draft,
		zone: getReferenceFromResourceIdentifier<ZoneReference>(
			draft.zone,
			context.projectKey,
			this._storage,
		),
		shippingRates: draft.shippingRates?.map(this._transformShippingRate),
	});

	private _transformShippingRate = (rate: ShippingRateDraft): ShippingRate => ({
		price: createTypedMoney(rate.price),
		freeAbove: rate.freeAbove && createTypedMoney(rate.freeAbove),
		tiers: rate.tiers || [],
	});

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

	actions: Partial<
		Record<
			ShippingMethodUpdateAction["action"],
			(
				context: RepositoryContext,
				resource: Writable<ShippingMethod>,
				action: any,
			) => void
		>
	> = {
		addShippingRate: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ shippingRate, zone }: ShippingMethodAddShippingRateAction,
		) => {
			const rate = this._transformShippingRate(shippingRate);

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
		},
		removeShippingRate: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ shippingRate, zone }: ShippingMethodAddShippingRateAction,
		) => {
			const rate = this._transformShippingRate(shippingRate);

			resource.zoneRates.forEach((zoneRate) => {
				if (zoneRate.zone.id === zone.id) {
					zoneRate.shippingRates = zoneRate.shippingRates.filter(
						(otherRate) => !deepEqual(rate, otherRate),
					);
				}
			});
		},
		addZone: (
			context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ zone }: ShippingMethodAddZoneAction,
		) => {
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
		},
		removeZone: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ zone }: ShippingMethodRemoveZoneAction,
		) => {
			resource.zoneRates = resource.zoneRates.filter(
				(zoneRate) => zoneRate.zone.id !== zone.id,
			);
		},
		setKey: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ key }: ShippingMethodSetKeyAction,
		) => {
			resource.key = key;
		},
		setDescription: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ description }: ShippingMethodSetDescriptionAction,
		) => {
			resource.description = description;
		},
		setLocalizedDescription: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ localizedDescription }: ShippingMethodSetLocalizedDescriptionAction,
		) => {
			resource.localizedDescription = localizedDescription;
		},
		setLocalizedName: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ localizedName }: ShippingMethodSetLocalizedNameAction,
		) => {
			resource.localizedName = localizedName;
		},
		setPredicate: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ predicate }: ShippingMethodSetPredicateAction,
		) => {
			resource.predicate = predicate;
		},
		changeIsDefault: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ isDefault }: ShippingMethodChangeIsDefaultAction,
		) => {
			resource.isDefault = isDefault;
		},
		changeName: (
			_context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ name }: ShippingMethodChangeNameAction,
		) => {
			resource.name = name;
		},
		setCustomType: (
			context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ type, fields }: ShippingMethodSetCustomTypeAction,
		) => {
			if (type) {
				resource.custom = createCustomFields(
					{ type, fields },
					context.projectKey,
					this._storage,
				);
			} else {
				resource.custom = undefined;
			}
		},
		setCustomField: (
			context: RepositoryContext,
			resource: Writable<ShippingMethod>,
			{ name, value }: ShippingMethodSetCustomFieldAction,
		) => {
			if (!resource.custom) {
				return;
			}
			if (value === null) {
				delete resource.custom.fields[name];
			} else {
				resource.custom.fields[name] = value;
			}
		},
	};
}
