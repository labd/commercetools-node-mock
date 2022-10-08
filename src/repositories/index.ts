import { AbstractStorage } from '../storage'
import { CartRepository } from './cart'
import { CartDiscountRepository } from './cart-discount'
import { CategoryRepository } from './category'
import { ChannelRepository } from './channel'
import { CustomObjectRepository } from './custom-object'
import { CustomerRepository } from './customer'
import { CustomerGroupRepository } from './customer-group'
import { DiscountCodeRepository } from './discount-code'
import { ExtensionRepository } from './extension'
import { InventoryEntryRepository } from './inventory-entry'
import { MyOrderRepository } from './my-order'
import { OrderRepository } from './order'
import { PaymentRepository } from './payment'
import { ProductRepository } from './product'
import { ProductDiscountRepository } from './product-discount'
import { ProductProjectionRepository } from './product-projection'
import { ProductTypeRepository } from './product-type'
import { ProjectRepository } from './project'
import { ShippingMethodRepository } from './shipping-method'
import { ShoppingListRepository } from './shopping-list'
import { StateRepository } from './state'
import { StoreRepository } from './store'
import { SubscriptionRepository } from './subscription'
import { TaxCategoryRepository } from './tax-category'
import { TypeRepository } from './type'
import { ZoneRepository } from './zone'

export const createRepositories = (storage: AbstractStorage) => ({
  category: new CategoryRepository(storage),
  cart: new CartRepository(storage),
  'cart-discount': new CartDiscountRepository(storage),
  customer: new CustomerRepository(storage),
  channel: new ChannelRepository(storage),
  'customer-group': new CustomerGroupRepository(storage),
  'discount-code': new DiscountCodeRepository(storage),
  extension: new ExtensionRepository(storage),
  'inventory-entry': new InventoryEntryRepository(storage),
  'key-value-document': new CustomObjectRepository(storage),
  order: new OrderRepository(storage),
  payment: new PaymentRepository(storage),
  'my-cart': new CartRepository(storage),
  'my-order': new MyOrderRepository(storage),
  'my-customer': new CustomerRepository(storage),
  'my-payment': new PaymentRepository(storage),
  'shipping-method': new ShippingMethodRepository(storage),
  'product-type': new ProductTypeRepository(storage),
  product: new ProductRepository(storage),
  project: new ProjectRepository(storage),
  'product-discount': new ProductDiscountRepository(storage),
  'product-projection': new ProductProjectionRepository(storage),
  'shopping-list': new ShoppingListRepository(storage),
  state: new StateRepository(storage),
  store: new StoreRepository(storage),
  subscription: new SubscriptionRepository(storage),
  'tax-category': new TaxCategoryRepository(storage),
  type: new TypeRepository(storage),
  zone: new ZoneRepository(storage),
})
