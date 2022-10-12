import {
  OrderEdit,
  OrderEditDraft,
  OrderEditResult,
  OrderEditUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { Writable } from '../types'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class OrderEditRepository extends AbstractResourceRepository<'order-edit'> {
  getTypeId() {
    return 'order-edit' as const
  }

  create(context: RepositoryContext, draft: OrderEditDraft): OrderEdit {
    const resource: OrderEdit = {
      ...getBaseResourceProperties(),
      stagedActions: draft.stagedActions ?? [],
      resource: draft.resource,
      result: {
        type: 'NotProcessed',
      } as OrderEditResult,
    }
    this.saveNew(context, resource)
    return resource
  }

  actions: Partial<
    Record<
      OrderEditUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<OrderEdit>,
        action: any
      ) => void
    >
  > = {}
}
