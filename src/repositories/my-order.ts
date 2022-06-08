import assert from 'assert'
import {
  CartReference,
  MyOrderFromCartDraft,
  Order,
} from '@commercetools/platform-sdk'
import { OrderRepository } from './order'

export class MyOrderRepository extends OrderRepository {
  create(projectKey: string, draft: MyOrderFromCartDraft): Order {
    assert(draft.id, 'draft.id is missing')
    const cartIdentifier = {
      id: draft.id,
      typeId: 'cart',
    } as CartReference
    return this.createFromCart(projectKey, cartIdentifier)
  }
}
