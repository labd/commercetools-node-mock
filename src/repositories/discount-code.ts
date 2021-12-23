import { DiscountCode, DiscountCodeDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'

export class DiscountCodeRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart-discount'
  }

  create(projectKey: string, draft: DiscountCodeDraft): DiscountCode {
    const resource: DiscountCode = {
      ...getBaseResourceProperties(),
      cartPredicate: draft.cartPredicate,
      name: draft.name,
      isActive: draft.isActive || false,
      references: [],
      groups: draft.groups || [],
      cartDiscounts: [], // TODO
      code: draft.code,

    }
    this.save(projectKey, resource)
    return resource
  }
}
