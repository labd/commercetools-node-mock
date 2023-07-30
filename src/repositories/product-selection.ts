import type {
  ProductSelection,
  ProductSelectionDraft,
  Review,
  ReviewUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import type { Writable } from '../types'
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
      mode: 'Individual',
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
