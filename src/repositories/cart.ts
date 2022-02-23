import { Cart, CartDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { createCustomFields } from './helpers'
import { ParsedQs } from 'qs'
import { parseFilterExpression } from '../lib/filterParser'

export class CartRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart'
  }

  create(projectKey: string, draft: CartDraft): Cart {
    const resource: Cart = {
      ...getBaseResourceProperties(),
      cartState: 'Active',
      lineItems: [],
      customLineItems: [],
      totalPrice: {
        type: 'centPrecision',
        centAmount: 0,
        currencyCode: draft.currency,
        fractionDigits: 0,
      },
      taxMode: 'Platform',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',
      refusedGifts: [],
      origin: 'Customer',
      custom: createCustomFields(draft.custom, projectKey, this._storage),
    }
    this.save(projectKey, resource)
    return resource
  }

  getActiveCart(projectKey: string): Cart | undefined {
    // Get first active cart
    const results = this._storage.query(projectKey, this.getTypeId(), {
      where: [`cartState="Active"`],
    })
    if (results.count > 0) {
      return results.results[0] as Cart
    }

    return
  }
}
