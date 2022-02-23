import {
  Cart,
  CartDraft,
  CartSetBillingAddressAction,
  CartSetCountryAction,
  CartSetCustomerEmailAction,
  CartSetCustomFieldAction,
  CartSetCustomTypeAction,
  CartSetLocaleAction,
  CartSetShippingAddressAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { createCustomFields } from './helpers'
import { Writable } from '../types'

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

  actions = {
    setBillingAddress: (
      projectKey: string,
      resource: Writable<Cart>,
      { address }: CartSetBillingAddressAction
    ) => {
      resource.billingAddress = address
    },
    setCountry: (
      projectKey: string,
      resource: Writable<Cart>,
      { country }: CartSetCountryAction
    ) => {
      resource.country = country
    },
    setCustomerEmail: (
      projectKey: string,
      resource: Writable<Cart>,
      { email }: CartSetCustomerEmailAction
    ) => {
      resource.customerEmail = email
    },
    setCustomField: (
      projectKey: string,
      resource: Cart,
      { name, value }: CartSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }
      resource.custom.fields[name] = value
    },
    setCustomType: (
      projectKey: string,
      resource: Writable<Cart>,
      { type, fields }: CartSetCustomTypeAction
    ) => {
      if (!type) {
        resource.custom = undefined
      } else {
        const resolvedType = this._storage.getByResourceIdentifier(
          projectKey,
          type
        )
        if (!resolvedType) {
          throw new Error(`Type ${type} not found`)
        }

        resource.custom = {
          type: {
            typeId: 'type',
            id: resolvedType.id,
          },
          fields: fields || [],
        }
      }
    },
    setLocale: (
      projectKey: string,
      resource: Writable<Cart>,
      { locale }: CartSetLocaleAction
    ) => {
      resource.locale = locale
    },
    setShippingAddress: (
      projectKey: string,
      resource: Writable<Cart>,
      { address }: CartSetShippingAddressAction
    ) => {
      resource.shippingAddress = address
    },
  }
}
