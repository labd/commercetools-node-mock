import type {
  CartReference,
  MyOrderFromCartDraft,
  Order,
} from '@commercetools/platform-sdk'
import assert from 'assert'
import { type RepositoryContext } from './abstract.js'
import { OrderRepository } from './order.js'

export class MyOrderRepository extends OrderRepository {
  create(context: RepositoryContext, draft: MyOrderFromCartDraft): Order {
    assert(draft.id, 'draft.id is missing')
    const cartIdentifier = {
      id: draft.id,
      typeId: 'cart',
    } as CartReference
    return this.createFromCart(context, cartIdentifier)
  }
}
