import type {
  CustomerReference,
  ShoppingList,
  ShoppingListDraft,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'
import {
  createCustomFields,
  getReferenceFromResourceIdentifier,
  getStoreKeyReference,
} from './helpers.js'

export class ShoppingListRepository extends AbstractResourceRepository<'shopping-list'> {
  getTypeId() {
    return 'shopping-list' as const
  }

  create(context: RepositoryContext, draft: ShoppingListDraft): ShoppingList {
    // const product =

    const resource: ShoppingList = {
      ...getBaseResourceProperties(),
      ...draft,
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
      textLineItems: [],
      lineItems:
        draft.lineItems?.map((e) => ({
          ...getBaseResourceProperties(),
          ...e,
          addedAt: e.addedAt ?? '',
          productId: e.productId ?? '',
          name: {},
          quantity: e.quantity ?? 1,
          productType: { typeId: 'product-type', id: '' },
          custom: createCustomFields(
            e.custom,
            context.projectKey,
            this._storage
          ),
        })) ?? [],
      customer: draft.customer
        ? getReferenceFromResourceIdentifier<CustomerReference>(
            draft.customer,
            context.projectKey,
            this._storage
          )
        : undefined,
      store: draft.store
        ? getStoreKeyReference(draft.store, context.projectKey, this._storage)
        : undefined,
    }
    this.saveNew(context, resource)
    return resource
  }
}
