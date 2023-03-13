import {
  StandalonePrice,
  StandalonePriceChangeActiveAction,
  StandalonePriceChangeValueAction,
  StandalonePriceSetDiscountedPriceAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { Writable } from '../types'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { createTypedMoney } from './helpers'

export class StandAlonePriceRepository extends AbstractResourceRepository<'standalone-price'> {
  getTypeId() {
    return 'standalone-price' as const
  }

  create(context: RepositoryContext, draft: StandalonePrice): StandalonePrice {
    const resource: StandalonePrice = {
      ...getBaseResourceProperties(),
      active: draft.active,
      sku: draft.sku,
      value: createTypedMoney(draft.value),
      country: draft.country,
      channel: draft.channel,
    }
    this.saveNew(context, resource)
    return resource
  }

  actions = {
    setActive: (
      context: RepositoryContext,
      resource: Writable<StandalonePrice>,
      action: StandalonePriceChangeActiveAction
    ) => {
      resource.active = action.active
    },
    changeValue: (
      context: RepositoryContext,
      resource: Writable<StandalonePrice>,
      action: StandalonePriceChangeValueAction
    ) => {
      resource.value = createTypedMoney(action.value)
    },
    setDiscountedPrice: ( 
      context: RepositoryContext,
      resource: Writable<StandalonePrice>,
      action: StandalonePriceSetDiscountedPriceAction
    ) => {
      if (action.discounted) {
        resource.discounted = {
          value: createTypedMoney(action.discounted.value),
          discount: action.discounted.discount,
        }
      } else {
        resource.discounted = undefined
      }
    }
  }
}
