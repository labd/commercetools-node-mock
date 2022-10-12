import assert from 'assert'
import {
  CartReference,
  MyOrderFromCartDraft,
  Order,
} from '@commercetools/platform-sdk'
import { OrderRepository } from './order'
import { RepositoryContext } from './abstract'

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
