import { CartDiscount, CartDiscountDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'

export class CartDiscountRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart-discount'
  }

  create(projectKey: string, draft: CartDiscountDraft): CartDiscount {
    const resource: CartDiscount = {
      ...getBaseResourceProperties(),
      cartPredicate: draft.cartPredicate,
      name: draft.name,
      value: draft.value,
      sortOrder: draft.sortOrder,
      isActive: draft.isActive || false,
      requiresDiscountCode: draft.requiresDiscountCode,
      references: [],
      stackingMode: draft.stackingMode || "Stacking"
    }
    this.save(projectKey, resource)
    return resource
  }
}
