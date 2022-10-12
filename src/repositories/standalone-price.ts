import {
  Review,
  StandalonePrice,
  StandalonePriceUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { Writable } from '../types'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class StandAlonePriceRepository extends AbstractResourceRepository<'standalone-price'> {
  getTypeId() {
    return 'standalone-price' as const
  }

  create(context: RepositoryContext, draft: StandalonePrice): StandalonePrice {
    const resource: StandalonePrice = {
      ...getBaseResourceProperties(),
      active: draft.active,
      sku: draft.sku,
      value: draft.value,
    }
    this.saveNew(context, resource)
    return resource
  }

  actions: Partial<
    Record<
      StandalonePriceUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<Review>,
        action: any
      ) => void
    >
  > = {}
}
