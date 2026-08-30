import type { createRepositories } from "../repositories/index.ts";
import { ApprovalFlowService } from "./approval-flow.ts";
import { ApprovalRuleService } from "./approval-rule.ts";
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

type ServiceFactory = (
	router: any,
	repos: ReturnType<typeof createRepositories>,
) => unknown;

const serviceFactories = {
	"approval-flow": (router, repos) =>
		new ApprovalFlowService(router, repos["approval-flow"]),
	"approval-rule": (router, repos) =>
		new ApprovalRuleService(router, repos["approval-rule"]),
	"associate-role": (router, repos) =>
		new AssociateRoleServices(router, repos["associate-role"]),
	"as-associate": (router, repos) =>
		new AsAssociateService(router, repos["as-associate"]),
	"business-unit": (router, repos) =>
		new BusinessUnitServices(router, repos["business-unit"]),
	category: (router, repos) => new CategoryServices(router, repos.category),
	cart: (router, repos) => new CartService(router, repos.cart, repos.order),
	"cart-discount": (router, repos) =>
		new CartDiscountService(router, repos["cart-discount"]),
	customer: (router, repos) => new CustomerService(router, repos.customer),
	channel: (router, repos) => new ChannelService(router, repos.channel),
	"customer-group": (router, repos) =>
		new CustomerGroupService(router, repos["customer-group"]),
	"discount-code": (router, repos) =>
		new DiscountCodeService(router, repos["discount-code"]),
	"discount-group": (router, repos) =>
		new DiscountGroupService(router, repos["discount-group"]),
	extension: (router, repos) => new ExtensionServices(router, repos.extension),
	"inventory-entry": (router, repos) =>
		new InventoryEntryService(router, repos["inventory-entry"]),
	"key-value-document": (router, repos) =>
		new CustomObjectService(router, repos["key-value-document"]),
	order: (router, repos) => new OrderService(router, repos.order),
	payment: (router, repos) => new PaymentService(router, repos.payment),
	"standalone-price": (router, repos) =>
		new StandAlonePriceService(router, repos["standalone-price"]),
	"my-cart": (router, repos) => new MyCartService(router, repos["my-cart"]),
	"my-order": (router, repos) => new MyOrderService(router, repos["my-order"]),
	"my-customer": (router, repos) =>
		new MyCustomerService(router, repos["my-customer"]),
	"my-business-unit": (router, repos) =>
		new MyBusinessUnitService(router, repos["business-unit"]),
	"my-payment": (router, repos) =>
		new MyPaymentService(router, repos["my-payment"]),
	"my-shopping-list": (router, repos) =>
		new MyShoppingListService(router, repos["my-shopping-list"]),
	"shipping-method": (router, repos) =>
		new ShippingMethodService(router, repos["shipping-method"]),
	"product-type": (router, repos) =>
		new ProductTypeService(router, repos["product-type"]),
	product: (router, repos) => new ProductService(router, repos.product),
	"product-discount": (router, repos) =>
		new ProductDiscountService(router, repos["product-discount"]),
	"product-projection": (router, repos) =>
		new ProductProjectionService(router, repos["product-projection"]),
	"product-selection": (router, repos) =>
		new ProductSelectionService(router, repos["product-selection"]),
	quotes: (router, repos) => new QuoteService(router, repos.quote),
	"quote-request": (router, repos) =>
		new QuoteRequestService(router, repos["quote-request"]),
	"recurrence-policy": (router, repos) =>
		new RecurrencePolicyService(router, repos["recurrence-policy"]),
	"recurring-order": (router, repos) =>
		new RecurringOrderService(router, repos["recurring-order"]),
	reviews: (router, repos) => new ReviewService(router, repos.review),
	"shopping-list": (router, repos) =>
		new ShoppingListService(router, repos["shopping-list"]),
	"staged-quote": (router, repos) =>
		new StagedQuoteService(router, repos["staged-quote"]),
	state: (router, repos) => new StateService(router, repos.state),
	store: (router, repos) => new StoreService(router, repos.store),
	subscription: (router, repos) =>
		new SubscriptionService(router, repos.subscription),
	"tax-category": (router, repos) =>
		new TaxCategoryService(router, repos["tax-category"]),
	"attribute-group": (router, repos) =>
		new AttributeGroupService(router, repos["attribute-group"]),
	type: (router, repos) => new TypeService(router, repos.type),
	zone: (router, repos) => new ZoneService(router, repos.zone),
} satisfies Record<string, ServiceFactory>;

export type ServiceKey = keyof typeof serviceFactories;

/**
 * Services mounted under `/{projectKey}/in-store/key={storeKey}`.
 *
 * commercetools documents in-store endpoints for a subset of resources only;
 * anything else under that prefix is a 404 on the real API. Mounting every
 * service there would make the mock accept requests that production rejects.
 *
 * `my-customer` is included because it also serves the in-store `/login` and
 * `/me/*` customer endpoints.
 */
export const IN_STORE_SERVICES: readonly ServiceKey[] = [
	"business-unit",
	"cart",
	"cart-discount",
	"customer",
	"discount-code",
	"my-cart",
	"my-customer",
	"my-order",
	"my-shopping-list",
	"order",
	"product",
	"product-projection",
	"quote-request",
	"quotes",
	"shipping-method",
	"shopping-list",
	"staged-quote",
];

export const createServices = (
	router: any,
	repos: ReturnType<typeof createRepositories>,
	keys: readonly ServiceKey[] = Object.keys(serviceFactories) as ServiceKey[],
): void => {
	for (const key of keys) {
		serviceFactories[key](router, repos);
	}
};
