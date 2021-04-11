import * as ctp from '@commercetools/platform-sdk'
import { ReferenceTypeId } from '@commercetools/platform-sdk'
import { CartRepository } from 'repositories/cart'
import { CustomObjectRepository } from 'repositories/custom-object'
import { CustomerRepository } from 'repositories/customer'
import { OrderRepository } from 'repositories/order'
import AbstractService from 'services/abstract'

export type Writable<T> = { -readonly [P in keyof T]: Writable<T[P]> }

export type Services = Partial<
  {
    [index in ReferenceTypeId]: AbstractService
  }
>

export type ResourceMap = {
  cart: ctp.Cart
  'cart-discount': ctp.CartDiscount
  category: ctp.Category
  channel: ctp.Channel
  customer: ctp.Customer
  'customer-group': ctp.CustomerGroup
  'discount-code': ctp.DiscountCode
  extension: ctp.Extension
  'inventory-entry': ctp.InventoryEntry
  'key-value-document': ctp.CustomObject
  order: ctp.Order
  'order-edit': ctp.OrderEdit
  payment: ctp.Payment
  product: ctp.Product
  'product-discount': ctp.ProductDiscount
  'product-type': ctp.ProductType
  review: ctp.Review
  'shipping-method': ctp.ShippingMethod
  'shopping-list': ctp.ShoppingList
  state: ctp.State
  store: ctp.Store
  subscription: ctp.Subscription
  'tax-category': ctp.TaxCategory
  type: ctp.Type
  zone: ctp.Zone

  'customer-email-token': never
  'customer-password-token': never
}

export type ResourceIdentifierMap = {
  cart: ctp.CartDiscountResourceIdentifier
  // 'cart': ctp.CartResourceIdentifier,
  // 'category': ctp.CategoryResourceIdentifier,
  // 'foobar': ctp.ChannelResourceIdentifier,
  // 'foobar': ctp.CustomerGroupResourceIdentifier,
  // 'foobar': ctp.CustomerResourceIdentifier,
  // 'foobar': ctp.DiscountCodeResourceIdentifier,
  // 'foobar': ctp.InventoryEntryResourceIdentifier,
  // 'foobar': ctp.OrderEditResourceIdentifier,
  // 'foobar': ctp.OrderResourceIdentifier,
  // 'foobar': ctp.PaymentResourceIdentifier,
  // 'foobar': ctp.ProductDiscountResourceIdentifier,
  // 'foobar': ctp.ProductResourceIdentifier,
  // 'foobar': ctp.ProductTypeResourceIdentifier,
  // 'foobar': ctp.ReviewResourceIdentifier,
  // 'foobar': ctp.ShippingMethodResourceIdentifier,
  // 'foobar': ctp.ShoppingListResourceIdentifier,
  // 'foobar': ctp.StateResourceIdentifier,
  // 'foobar': ctp.StoreResourceIdentifier,
  // 'foobar': ctp.TaxCategoryResourceIdentifier,
  // 'foobar': ctp.TypeResourceIdentifier,
  // 'foobar': ctp.ZoneResourceIdentifier,
}

export type RepositoryMap = {
  cart: CartRepository
  customer: CustomerRepository
  'key-value-document': CustomObjectRepository
  type: ctp.Type
  zone: ctp.Zone

  'cart-discount': never
  category: never
  channel: never
  'customer-group': never
  'discount-code': never
  extension: never
  'inventory-entry': never
  order: OrderRepository
  'order-edit': never
  payment: never
  product: never
  'product-discount': never
  'product-type': never
  review: never
  'shipping-method': never
  'shopping-list': never
  state: never
  store: never
  subscription: never
  'tax-category': never

  'customer-email-token': never
  'customer-password-token': never
}
