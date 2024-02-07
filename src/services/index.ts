import { AssociateRoleServices } from './associate-roles.js'
import { AttributeGroupService } from './attribute-group.js'
import { BusinessUnitServices } from './business-units.js'
import { CartDiscountService } from './cart-discount.js'
import { CartService } from './cart.js'
import { CategoryServices } from './category.js'
import { ChannelService } from './channel.js'
import { CustomObjectService } from './custom-object.js'
import { CustomerGroupService } from './customer-group.js'
import { CustomerService } from './customer.js'
import { DiscountCodeService } from './discount-code.js'
import { ExtensionServices } from './extension.js'
import { InventoryEntryService } from './inventory-entry.js'
import { MyCartService } from './my-cart.js'
import { MyCustomerService } from './my-customer.js'
import { MyOrderService } from './my-order.js'
import { MyPaymentService } from './my-payment.js'
import { MyShoppingListService } from './my-shopping-list.js'
import { OrderService } from './order.js'
import { PaymentService } from './payment.js'
import { ProductDiscountService } from './product-discount.js'
import { ProductProjectionService } from './product-projection.js'
import { ProductSelectionService } from './product-selection.js'
import { ProductTypeService } from './product-type.js'
import { ProductService } from './product.js'
import { ReviewService } from './reviews.js'
import { ShippingMethodService } from './shipping-method.js'
import { ShoppingListService } from './shopping-list.js'
import { StandAlonePriceService } from './standalone-price.js'
import { StateService } from './state.js'
import { StoreService } from './store.js'
import { SubscriptionService } from './subscription.js'
import { TaxCategoryService } from './tax-category.js'
import { TypeService } from './type.js'
import { ZoneService } from './zone.js'

export const createServices = (router: any, repos: any) => ({
	'associate-role': new AssociateRoleServices(router, repos['associate-role']),
	'business-unit': new BusinessUnitServices(router, repos['business-unit']),
	category: new CategoryServices(router, repos['category']),
	cart: new CartService(router, repos['cart'], repos['order']),
	'cart-discount': new CartDiscountService(router, repos['cart-discount']),
	customer: new CustomerService(router, repos['customer']),
	channel: new ChannelService(router, repos['channel']),
	'customer-group': new CustomerGroupService(router, repos['customer-group']),
	'discount-code': new DiscountCodeService(router, repos['discount-code']),
	extension: new ExtensionServices(router, repos['extension']),
	'inventory-entry': new InventoryEntryService(
		router,
		repos['inventory-entry']
	),
	'key-value-document': new CustomObjectService(
		router,
		repos['key-value-document']
	),
	order: new OrderService(router, repos['order']),
	payment: new PaymentService(router, repos['payment']),
	'standalone-price': new StandAlonePriceService(
		router,
		repos['standalone-price']
	),
	'my-cart': new MyCartService(router, repos['my-cart']),
	'my-order': new MyOrderService(router, repos['my-order']),
	'my-customer': new MyCustomerService(router, repos['my-customer']),
	'my-payment': new MyPaymentService(router, repos['my-payment']),
	'my-shopping-list': new MyShoppingListService(
		router,
		repos['my-shopping-list']
	),
	'shipping-method': new ShippingMethodService(
		router,
		repos['shipping-method']
	),
	'product-type': new ProductTypeService(router, repos['product-type']),
	product: new ProductService(router, repos['product']),
	'product-discount': new ProductDiscountService(
		router,
		repos['product-discount']
	),
	'product-projection': new ProductProjectionService(
		router,
		repos['product-projection']
	),
	'product-selection': new ProductSelectionService(
		router,
		repos['product-selection']
	),
	reviews: new ReviewService(router, repos['review']),
	'shopping-list': new ShoppingListService(router, repos['shopping-list']),
	state: new StateService(router, repos['state']),
	store: new StoreService(router, repos['store']),
	subscription: new SubscriptionService(router, repos['subscription']),
	'tax-category': new TaxCategoryService(router, repos['tax-category']),
	'attribute-group': new AttributeGroupService(
		router,
		repos['attribute-group']
	),
	type: new TypeService(router, repos['type']),
	zone: new ZoneService(router, repos['zone']),
})
