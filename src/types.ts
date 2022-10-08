import { ProductProjectionRepository } from './repositories/product-projection'
import { ShoppingListRepository } from './repositories/shopping-list'
import * as ctp from '@commercetools/platform-sdk'
import {
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import AbstractService from './services/abstract'
import { CartRepository } from './repositories/cart'
import { CustomerRepository } from './repositories/customer'
import { CustomObjectRepository } from './repositories/custom-object'
import { InventoryEntryRepository } from './repositories/inventory-entry'
import { OrderRepository } from './repositories/order'
import { PaymentRepository } from './repositories/payment'
import { ProductRepository } from './repositories/product'
import { ProductTypeRepository } from './repositories/product-type'
import { ShippingMethodRepository } from './repositories/shipping-method'
import { StateRepository } from './repositories/state'
import { TaxCategoryRepository } from './repositories/tax-category'
import { ProductDiscountRepository } from 'repositories/product-discount'
import { AbstractRepository } from 'repositories/abstract'

export type Writable<T> = { -readonly [P in keyof T]: Writable<T[P]> }

export type RepositoryTypes =
  | ReferenceTypeId
  | 'standalone-price'
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
  review: ctp.Review
  'shipping-method': ctp.ShippingMethod
  'shopping-list': ctp.ShoppingList
  'standalone-price': ctp.StandalonePrice
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

export type RepositoryMap = {
  cart: CartRepository
  'cart-discount': never
  category: never
  channel: never
  customer: CustomerRepository
  'customer-email-token': never
  'customer-group': never
  'customer-password-token': never
  'discount-code': never
  extension: never
  'inventory-entry': InventoryEntryRepository
  'key-value-document': CustomObjectRepository
  order: OrderRepository
  'order-edit': never
  payment: PaymentRepository
  product: ProductRepository
  'product-projection': ProductProjectionRepository
  'product-discount': ProductDiscountRepository
  'product-type': ProductTypeRepository
  review: never
  'shipping-method': ShippingMethodRepository
  'shopping-list': ShoppingListRepository
  state: StateRepository
  store: never
  subscription: never
  'tax-category': TaxCategoryRepository
  type: ctp.Type
  zone: ctp.Zone
}
