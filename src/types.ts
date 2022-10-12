import * as ctp from '@commercetools/platform-sdk'
import {
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import AbstractService from './services/abstract'
import { AbstractRepository } from 'repositories/abstract'
import { RepositoryMap } from './repositories'

export type Writable<T> = { -readonly [P in keyof T]: Writable<T[P]> }

export type RepositoryTypes =
  | ReferenceTypeId
  | 'product-projection'

export type ServiceTypes =
  | RepositoryTypes
  | 'my-cart'
  | 'my-order'
  | 'my-payment'
  | 'my-customer'
  | 'product-projection'

export type Services = Partial<{
  [index in ServiceTypes]: AbstractService
}>

export type Repositories = Partial<{
  [index in RepositoryTypes | 'project']: AbstractRepository
}>


export type Resource =
  | ctp.BaseResource
  | ctp.Cart
  | ctp.CartDiscount
  | ctp.Category
  | ctp.Channel
  | ctp.Customer
  | ctp.CustomerGroup
  | ctp.DiscountCode
  | ctp.Extension
  | ctp.InventoryEntry
  | ctp.CustomObject
  | ctp.Order
  | ctp.OrderEdit
  | ctp.Payment
  | ctp.Product
  | ctp.Project
  | ctp.ProductDiscount
  | ctp.ProductProjection
  | ctp.ProductSelection
  | ctp.StandalonePrice
  | ctp.ProductType
  | ctp.Review
  | ctp.ShippingMethod
  | ctp.ShoppingList
  | ctp.StandalonePrice
  | ctp.State
  | ctp.Store
  | ctp.Subscription
  | ctp.TaxCategory
  | ctp.Type
  | ctp.Zone


export type ResourceType = keyof ResourceMap & keyof RepositoryMap

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
  'product-projection': ctp.ProductProjection
  'product-selection': ctp.ProductSelection
  'product-price': ctp.StandalonePrice
  'product-type': ctp.ProductType
  'quote': ctp.Quote,
  'quote-request': ctp.QuoteRequest,
  review: ctp.Review
  'shipping-method': ctp.ShippingMethod
  'shopping-list': ctp.ShoppingList
  'standalone-price': ctp.StandalonePrice
  'staged-quote': ctp.StagedQuote,
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
  channel: ctp.ChannelResourceIdentifier
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

