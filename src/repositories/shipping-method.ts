import {
  createCustomFields,
  createTypedMoney,
  getReferenceFromResourceIdentifier,
} from './helpers'
import {
  ReferenceTypeId,
  ShippingMethod,
  ShippingMethodDraft,
  ZoneRate,
  ZoneRateDraft,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'

export class ShippingMethodRepository extends AbstractRepository {
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
      zoneRates: draft.zoneRates.map(z =>
        this.zoneRateFromZoneRateDraft(projectKey, z)
      ),
      custom: createCustomFields(draft.custom, projectKey, this._storage),
    }
    this.save(projectKey, resource)
    return resource
  }

  zoneRateFromZoneRateDraft = (
    projectKey: string,
    draft: ZoneRateDraft
  ): ZoneRate => ({
    ...draft,
    zone: getReferenceFromResourceIdentifier(
      draft.zone,
      projectKey,
      this._storage
    ),
    shippingRates: draft.shippingRates.map(s => ({
      ...s,
      price: createTypedMoney(s.price),
      freeAbove: s.freeAbove && createTypedMoney(s.freeAbove),
      tiers: s.tiers || [],
    })),
  })

  actions = {}
}
