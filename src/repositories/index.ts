import { AbstractStorage } from '../storage/index.js'
import { AssociateRoleRepository } from './associate-role.js'
import { AttributeGroupRepository } from './attribute-group.js'
import { BusinessUnitRepository } from './business-unit.js'
import { CartRepository } from './cart.js'
import { CartDiscountRepository } from './cart-discount.js'
import { CategoryRepository } from './category.js'
import { ChannelRepository } from './channel.js'
import { CustomObjectRepository } from './custom-object.js'
import { CustomerRepository } from './customer.js'
import { CustomerGroupRepository } from './customer-group.js'
import { DiscountCodeRepository } from './discount-code.js'
import { ExtensionRepository } from './extension.js'
import { InventoryEntryRepository } from './inventory-entry.js'
import { MyOrderRepository } from './my-order.js'
import { OrderRepository } from './order.js'
import { OrderEditRepository } from './order-edit.js'
import { PaymentRepository } from './payment.js'
import { ProductRepository } from './product.js'
import { ProductDiscountRepository } from './product-discount.js'
import { ProductProjectionRepository } from './product-projection.js'
import { ProductSelectionRepository } from './product-selection.js'
import { ProductTypeRepository } from './product-type.js'
import { ProjectRepository } from './project.js'
import { QuoteRepository } from './quote.js'
import { QuoteRequestRepository } from './quote-request.js'
import { ReviewRepository } from './review.js'
import { ShippingMethodRepository } from './shipping-method.js'
import { ShoppingListRepository } from './shopping-list.js'
import { StagedQuoteRepository } from './staged-quote.js'
import { StandAlonePriceRepository } from './standalone-price.js'
import { StateRepository } from './state.js'
import { StoreRepository } from './store.js'
import { SubscriptionRepository } from './subscription.js'
import { TaxCategoryRepository } from './tax-category.js'
import { TypeRepository } from './type.js'
import { ZoneRepository } from './zone.js'

export type RepositoryMap = ReturnType<typeof createRepositories>

export const createRepositories = (storage: AbstractStorage) => ({
	'associate-role': new AssociateRoleRepository(storage),
	'attribute-group': new AttributeGroupRepository(storage),
	'business-unit': new BusinessUnitRepository(storage),
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
	'my-shopping-list': new ShoppingListRepository(storage),
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
