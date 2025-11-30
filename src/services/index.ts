import type { createRepositories } from "../repositories/index.ts";
import { AsAssociateService } from "./as-associate.ts";
import { AssociateRoleServices } from "./associate-roles.ts";
import { AttributeGroupService } from "./attribute-group.ts";
import { BusinessUnitServices } from "./business-units.ts";
import { CartService } from "./cart.ts";
import { CartDiscountService } from "./cart-discount.ts";
import { CategoryServices } from "./category.ts";
import { ChannelService } from "./channel.ts";
import { CustomObjectService } from "./custom-object.ts";
import { CustomerService } from "./customer.ts";
import { CustomerGroupService } from "./customer-group.ts";
import { DiscountCodeService } from "./discount-code.ts";
import { DiscountGroupService } from "./discount-group.ts";
import { ExtensionServices } from "./extension.ts";
import { InventoryEntryService } from "./inventory-entry.ts";
import { MyBusinessUnitService } from "./my-business-unit.ts";
import { MyCartService } from "./my-cart.ts";
import { MyCustomerService } from "./my-customer.ts";
import { MyOrderService } from "./my-order.ts";
import { MyPaymentService } from "./my-payment.ts";
import { MyShoppingListService } from "./my-shopping-list.ts";
import { OrderService } from "./order.ts";
import { PaymentService } from "./payment.ts";
import { ProductService } from "./product.ts";
import { ProductDiscountService } from "./product-discount.ts";
import { ProductProjectionService } from "./product-projection.ts";
import { ProductSelectionService } from "./product-selection.ts";
import { ProductTypeService } from "./product-type.ts";
import { QuoteService } from "./quote.ts";
import { QuoteRequestService } from "./quote-request.ts";
import { StagedQuoteService } from "./quote-staged.ts";
import { RecurrencePolicyService } from "./recurrence-policy.ts";
import { RecurringOrderService } from "./recurring-order.ts";
import { ReviewService } from "./reviews.ts";
import { ShippingMethodService } from "./shipping-method.ts";
import { ShoppingListService } from "./shopping-list.ts";
import { StandAlonePriceService } from "./standalone-price.ts";
import { StateService } from "./state.ts";
import { StoreService } from "./store.ts";
import { SubscriptionService } from "./subscription.ts";
import { TaxCategoryService } from "./tax-category.ts";
import { TypeService } from "./type.ts";
import { ZoneService } from "./zone.ts";

export const createServices = (
	router: any,
	repos: ReturnType<typeof createRepositories>,
) => ({
	"associate-role": new AssociateRoleServices(router, repos["associate-role"]),
	"as-associate": new AsAssociateService(router, repos["as-associate"]),
	"business-unit": new BusinessUnitServices(router, repos["business-unit"]),
	category: new CategoryServices(router, repos.category),
	cart: new CartService(router, repos.cart, repos.order),
	"cart-discount": new CartDiscountService(router, repos["cart-discount"]),
	customer: new CustomerService(router, repos.customer),
	channel: new ChannelService(router, repos.channel),
	"customer-group": new CustomerGroupService(router, repos["customer-group"]),
	"discount-code": new DiscountCodeService(router, repos["discount-code"]),
	"discount-group": new DiscountGroupService(router, repos["discount-group"]),
	extension: new ExtensionServices(router, repos.extension),
	"inventory-entry": new InventoryEntryService(
		router,
		repos["inventory-entry"],
	),
	"key-value-document": new CustomObjectService(
		router,
		repos["key-value-document"],
	),
	order: new OrderService(router, repos.order),
	payment: new PaymentService(router, repos.payment),
	"standalone-price": new StandAlonePriceService(
		router,
		repos["standalone-price"],
	),
	"my-cart": new MyCartService(router, repos["my-cart"]),
	"my-order": new MyOrderService(router, repos["my-order"]),
	"my-customer": new MyCustomerService(router, repos["my-customer"]),
	"my-business-unit": new MyBusinessUnitService(router, repos["business-unit"]),
	"my-payment": new MyPaymentService(router, repos["my-payment"]),
	"my-shopping-list": new MyShoppingListService(
		router,
		repos["my-shopping-list"],
	),
	"shipping-method": new ShippingMethodService(
		router,
		repos["shipping-method"],
	),
	"product-type": new ProductTypeService(router, repos["product-type"]),
	product: new ProductService(router, repos.product),
	"product-discount": new ProductDiscountService(
		router,
		repos["product-discount"],
	),
	"product-projection": new ProductProjectionService(
		router,
		repos["product-projection"],
	),
	"product-selection": new ProductSelectionService(
		router,
		repos["product-selection"],
	),
	quotes: new QuoteService(router, repos.quote),
	"quote-request": new QuoteRequestService(router, repos["quote-request"]),
	"recurrence-policy": new RecurrencePolicyService(
		router,
		repos["recurrence-policy"],
	),
	"recurring-order": new RecurringOrderService(
		router,
		repos["recurring-order"],
	),
	reviews: new ReviewService(router, repos.review),
	"shopping-list": new ShoppingListService(router, repos["shopping-list"]),
	"staged-quote": new StagedQuoteService(router, repos["staged-quote"]),
	state: new StateService(router, repos.state),
	store: new StoreService(router, repos.store),
	subscription: new SubscriptionService(router, repos.subscription),
	"tax-category": new TaxCategoryService(router, repos["tax-category"]),
	"attribute-group": new AttributeGroupService(
		router,
		repos["attribute-group"],
	),
	type: new TypeService(router, repos.type),
	zone: new ZoneService(router, repos.zone),
});
