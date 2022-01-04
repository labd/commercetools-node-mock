import {
  CustomerReference,
  ReferenceTypeId,
  ShoppingList,
  ShoppingListDraft,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import {
  createCustomFields,
  getReferenceFromResourceIdentifier,
} from './helpers'

export class ShoppingListRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'shopping-list'
  }
  create(projectKey: string, draft: ShoppingListDraft): ShoppingList {
    // const product =

    const resource: ShoppingList = {
      ...getBaseResourceProperties(),
      ...draft,
      custom: createCustomFields(draft.custom, projectKey, this._storage),
      textLineItems: [],
      lineItems: draft.lineItems?.map(e => ({
        ...getBaseResourceProperties(),
        ...e,
        addedAt: e.addedAt ?? '',
        productId: e.productId ?? '',
        name: {},
        quantity: e.quantity ?? 1,
        productType: { typeId: 'product-type', id: '' },
        custom: createCustomFields(e.custom, projectKey, this._storage),
      })),
      customer: draft.customer
        ? getReferenceFromResourceIdentifier<CustomerReference>(
            draft.customer,
            projectKey,
            this._storage
          )
        : undefined,
      store: draft.store?.key
        ? { typeId: 'store', key: draft.store.key! }
        : undefined,
    }
    this.save(projectKey, resource)
    return resource
  }
}
