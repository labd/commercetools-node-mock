import {
  Review,
  ProductSelectionDraft,
  ReviewUpdateAction,
  ProductSelection,
} from '@commercetools/platform-sdk'
import { Writable } from '../types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class ProductSelectionRepository extends AbstractResourceRepository<'product-selection'> {
  getTypeId() {
    return 'product-selection' as const
  }

  create(
    context: RepositoryContext,
    draft: ProductSelectionDraft
  ): ProductSelection {
    const resource: ProductSelection = {
      ...getBaseResourceProperties(),
      productCount: 0,
      name: draft.name,
      type: 'individual',
    }
    this.saveNew(context, resource)
    return resource
  }

  actions: Partial<
    Record<
      ReviewUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<Review>,
        action: any
      ) => void
    >
  > = {}
}
