import {
  createCustomFields,
  createTypedMoney,
  getReferenceFromResourceIdentifier,
} from './helpers'
import {
  ReferenceTypeId,
  ShippingMethod,
  ShippingMethodAddShippingRateAction,
  ShippingMethodAddZoneAction,
  ShippingMethodChangeIsDefaultAction,
  ShippingMethodChangeNameAction,
  ShippingMethodDraft,
  ShippingMethodRemoveZoneAction,
  ShippingMethodSetDescriptionAction,
  ShippingMethodSetKeyAction,
  ShippingMethodSetLocalizedDescriptionAction,
  ShippingMethodSetPredicateAction,
  ShippingMethodUpdateAction,
  ShippingRate,
  ShippingRateDraft,
  ZoneRate,
  ZoneRateDraft,
  ZoneReference,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { Writable } from 'types'
import { _ } from 'ajv'
import deepEqual from 'deep-equal'

export class ShippingMethodRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'shipping-method'
  }

  create(projectKey: string, draft: ShippingMethodDraft): ShippingMethod {
    const resource: ShippingMethod = {
      ...getBaseResourceProperties(),
      ...draft,
      taxCategory: getReferenceFromResourceIdentifier(
        draft.taxCategory,
        projectKey,
        this._storage
      ),
      zoneRates: draft.zoneRates?.map(z =>
        this._transformZoneRateDraft(projectKey, z)
      ),
      custom: createCustomFields(draft.custom, projectKey, this._storage),
    }
    this.save(projectKey, resource)
    return resource
  }

  private _transformZoneRateDraft = (
    projectKey: string,
    draft: ZoneRateDraft
  ): ZoneRate => ({
    ...draft,
    zone: getReferenceFromResourceIdentifier<ZoneReference>(
      draft.zone,
      projectKey,
      this._storage
    ),
    shippingRates: draft.shippingRates?.map(this._transformShippingRate),
  })

  private _transformShippingRate = (rate: ShippingRateDraft): ShippingRate => {
    return {
      price: createTypedMoney(rate.price),
      freeAbove: rate.freeAbove && createTypedMoney(rate.freeAbove),
      tiers: rate.tiers || [],
    }
  }

  actions: Partial<
    Record<
      ShippingMethodUpdateAction['action'],
      (
        projectKey: string,
        resource: Writable<ShippingMethod>,
        action: any
      ) => void
    >
  > = {
    addShippingRate: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { shippingRate, zone }: ShippingMethodAddShippingRateAction
    ) => {
      const rate = this._transformShippingRate(shippingRate)

      resource.zoneRates.forEach(zoneRate => {
        if (zoneRate.zone.id == zone.id) {
          zoneRate.shippingRates.push(rate)
          return
        }
      })
      resource.zoneRates.push({
        zone: {
          typeId: 'zone',
          id: zone.id!,
        },
        shippingRates: [rate],
      })
    },
    removeShippingRate: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { shippingRate, zone }: ShippingMethodAddShippingRateAction
    ) => {
      const rate = this._transformShippingRate(shippingRate)

      resource.zoneRates.forEach(zoneRate => {
        if (zoneRate.zone.id == zone.id) {
          zoneRate.shippingRates = zoneRate.shippingRates.filter(otherRate => {
            return !deepEqual(rate, otherRate)
          })
        }
      })
    },
    addZone: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { zone }: ShippingMethodAddZoneAction
    ) => {
      const zoneReference = getReferenceFromResourceIdentifier<ZoneReference>(
        zone,
        projectKey,
        this._storage
      )

      if (resource.zoneRates === undefined) {
        resource.zoneRates = []
      }

      resource.zoneRates.push({
        zone: zoneReference,
        shippingRates: [],
      })
    },
    removeZone: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { zone }: ShippingMethodRemoveZoneAction
    ) => {
      resource.zoneRates = resource.zoneRates.filter(zoneRate => {
        return zoneRate.zone.id !== zone.id
      })
    },
    setKey: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { key }: ShippingMethodSetKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { description }: ShippingMethodSetDescriptionAction
    ) => {
      resource.description = description
    },
    setLocalizedDescription: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { localizedDescription }: ShippingMethodSetLocalizedDescriptionAction
    ) => {
      resource.localizedDescription = localizedDescription
    },
    setPredicate: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { predicate }: ShippingMethodSetPredicateAction
    ) => {
      resource.predicate = predicate
    },
    changeIsDefault: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { isDefault }: ShippingMethodChangeIsDefaultAction
    ) => {
      resource.isDefault = isDefault
    },
    changeName: (
      projectKey: string,
      resource: Writable<ShippingMethod>,
      { name }: ShippingMethodChangeNameAction
    ) => {
      resource.name = name
    },
  }
}
