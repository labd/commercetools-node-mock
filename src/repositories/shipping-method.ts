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
  ShippingMethodSetCustomFieldAction,
  ShippingMethodSetCustomTypeAction,
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
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { Writable } from 'types'
import deepEqual from 'deep-equal'

export class ShippingMethodRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'shipping-method'
  }

  create(
    context: RepositoryContext,
    draft: ShippingMethodDraft
  ): ShippingMethod {
    const resource: ShippingMethod = {
      ...getBaseResourceProperties(),
      ...draft,
      taxCategory: getReferenceFromResourceIdentifier(
        draft.taxCategory,
        context.projectKey,
        this._storage
      ),
      zoneRates: draft.zoneRates?.map((z) =>
        this._transformZoneRateDraft(context, z)
      ),
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
    }
    this.saveNew(context, resource)
    return resource
  }

  private _transformZoneRateDraft = (
    context: RepositoryContext,
    draft: ZoneRateDraft
  ): ZoneRate => ({
    ...draft,
    zone: getReferenceFromResourceIdentifier<ZoneReference>(
      draft.zone,
      context.projectKey,
      this._storage
    ),
    shippingRates: draft.shippingRates?.map(this._transformShippingRate),
  })

  private _transformShippingRate = (rate: ShippingRateDraft): ShippingRate => ({
    price: createTypedMoney(rate.price),
    freeAbove: rate.freeAbove && createTypedMoney(rate.freeAbove),
    tiers: rate.tiers || [],
  })

  actions: Partial<
    Record<
      ShippingMethodUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<ShippingMethod>,
        action: any
      ) => void
    >
  > = {
    addShippingRate: (
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { shippingRate, zone }: ShippingMethodAddShippingRateAction
    ) => {
      const rate = this._transformShippingRate(shippingRate)

      resource.zoneRates.forEach((zoneRate) => {
        if (zoneRate.zone.id === zone.id) {
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
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { shippingRate, zone }: ShippingMethodAddShippingRateAction
    ) => {
      const rate = this._transformShippingRate(shippingRate)

      resource.zoneRates.forEach((zoneRate) => {
        if (zoneRate.zone.id === zone.id) {
          zoneRate.shippingRates = zoneRate.shippingRates.filter(
            (otherRate) => !deepEqual(rate, otherRate)
          )
        }
      })
    },
    addZone: (
      context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { zone }: ShippingMethodAddZoneAction
    ) => {
      const zoneReference = getReferenceFromResourceIdentifier<ZoneReference>(
        zone,
        context.projectKey,
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
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { zone }: ShippingMethodRemoveZoneAction
    ) => {
      resource.zoneRates = resource.zoneRates.filter(
        (zoneRate) => zoneRate.zone.id !== zone.id
      )
    },
    setKey: (
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { key }: ShippingMethodSetKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { description }: ShippingMethodSetDescriptionAction
    ) => {
      resource.description = description
    },
    setLocalizedDescription: (
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { localizedDescription }: ShippingMethodSetLocalizedDescriptionAction
    ) => {
      resource.localizedDescription = localizedDescription
    },
    setPredicate: (
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { predicate }: ShippingMethodSetPredicateAction
    ) => {
      resource.predicate = predicate
    },
    changeIsDefault: (
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { isDefault }: ShippingMethodChangeIsDefaultAction
    ) => {
      resource.isDefault = isDefault
    },
    changeName: (
      _context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { name }: ShippingMethodChangeNameAction
    ) => {
      resource.name = name
    },
    setCustomType: (
      context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { type, fields }: ShippingMethodSetCustomTypeAction
    ) => {
      if (type) {
        resource.custom = createCustomFields(
          { type, fields },
          context.projectKey,
          this._storage
        )
      } else {
        resource.custom = undefined
      }
    },
    setCustomField: (
      context: RepositoryContext,
      resource: Writable<ShippingMethod>,
      { name, value }: ShippingMethodSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        return
      }
      if (value === null) {
        delete resource.custom.fields[name]
      } else {
        resource.custom.fields[name] = value
      }
    },
  }
}
