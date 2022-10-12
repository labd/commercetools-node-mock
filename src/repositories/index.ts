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
import { OrderEditRepository } from './order-edit'
import { PaymentRepository } from './payment'
import { ProductRepository } from './product'
import { ProductDiscountRepository } from './product-discount'
import { ProductProjectionRepository } from './product-projection'
import { ProductSelectionRepository } from './product-selection'
import { ProductTypeRepository } from './product-type'
import { ProjectRepository } from './project'
import { QuoteRepository } from './quote'
import { QuoteRequestRepository } from './quote-request'
import { ReviewRepository } from './review'
import { ShippingMethodRepository } from './shipping-method'
import { ShoppingListRepository } from './shopping-list'
import { StagedQuoteRepository } from './staged-quote'
import { StandAlonePriceRepository } from './standalone-price'
import { StateRepository } from './state'
import { StoreRepository } from './store'
import { SubscriptionRepository } from './subscription'
import { TaxCategoryRepository } from './tax-category'
import { TypeRepository } from './type'
import { ZoneRepository } from './zone'

export type RepositoryMap = ReturnType<typeof createRepositories>

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
  'order-edit': new OrderEditRepository(storage),
  payment: new PaymentRepository(storage),
  'my-cart': new CartRepository(storage),
  'my-order': new MyOrderRepository(storage),
  'my-customer': new CustomerRepository(storage),
  'my-payment': new PaymentRepository(storage),
  product: new ProductRepository(storage),
  'product-type': new ProductTypeRepository(storage),
  'product-discount': new ProductDiscountRepository(storage),
  'product-projection': new ProductProjectionRepository(storage),
  'product-selection': new ProductSelectionRepository(storage),
  project: new ProjectRepository(storage),
  review: new ReviewRepository(storage),
  quote: new QuoteRepository(storage),
  'quote-request': new QuoteRequestRepository(storage),
  'shipping-method': new ShippingMethodRepository(storage),
  'shopping-list': new ShoppingListRepository(storage),
  'staged-quote': new StagedQuoteRepository(storage),
  'standalone-price': new StandAlonePriceRepository(storage),
  state: new StateRepository(storage),
  store: new StoreRepository(storage),
  subscription: new SubscriptionRepository(storage),
  'tax-category': new TaxCategoryRepository(storage),
  type: new TypeRepository(storage),
  zone: new ZoneRepository(storage),
})
