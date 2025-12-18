import type { Config } from "#src/config.ts";
import { ProductTailoringRepository } from "#src/repositories/product-tailoring.ts";
import {
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
	AsAssociateQuoteRequestRepository,
	AsAssociateShoppingListRepository,
} from "./as-associate.ts";
import { AssociateRoleRepository } from "./associate-role.ts";
import { AttributeGroupRepository } from "./attribute-group.ts";
import { BusinessUnitRepository } from "./business-unit.ts";
import { CartRepository } from "./cart/index.ts";
import { CartDiscountRepository } from "./cart-discount/index.ts";
import { CategoryRepository } from "./category/index.ts";
import { ChannelRepository } from "./channel.ts";
import { CustomObjectRepository } from "./custom-object.ts";
import { CustomerRepository } from "./customer/index.ts";
import { CustomerGroupRepository } from "./customer-group.ts";
import { DiscountCodeRepository } from "./discount-code/index.ts";
import { DiscountGroupRepository } from "./discount-group/index.ts";
import { ExtensionRepository } from "./extension.ts";
import { InventoryEntryRepository } from "./inventory-entry/index.ts";
import { MyCustomerRepository } from "./my-customer.ts";
import { MyOrderRepository } from "./my-order.ts";
import { OrderRepository } from "./order/index.ts";
import { OrderEditRepository } from "./order-edit.ts";
import { PaymentRepository } from "./payment/index.ts";
import { ProductRepository } from "./product/index.ts";
import { ProductDiscountRepository } from "./product-discount.ts";
import { ProductProjectionRepository } from "./product-projection.ts";
import { ProductSelectionRepository } from "./product-selection.ts";
import { ProductTypeRepository } from "./product-type.ts";
import { ProjectRepository } from "./project.ts";
import { QuoteRepository } from "./quote/index.ts";
import { QuoteRequestRepository } from "./quote-request/index.ts";
import { StagedQuoteRepository } from "./quote-staged/index.ts";
import { RecurrencePolicyRepository } from "./recurrence-policy/index.ts";
import { RecurringOrderRepository } from "./recurring-order/index.ts";
import { ReviewRepository } from "./review.ts";
import { ShippingMethodRepository } from "./shipping-method/index.ts";
import { ShoppingListRepository } from "./shopping-list/index.ts";
import { StandAlonePriceRepository } from "./standalone-price.ts";
import { StateRepository } from "./state.ts";
import { StoreRepository } from "./store.ts";
import { SubscriptionRepository } from "./subscription.ts";
import { TaxCategoryRepository } from "./tax-category/index.ts";
import { TypeRepository } from "./type/index.ts";
import { ZoneRepository } from "./zone.ts";

export type RepositoryMap = ReturnType<typeof createRepositories>;

export const createRepositories = (config: Config) => ({
	"as-associate": {
		cart: new AsAssociateCartRepository(config),
		order: new AsAssociateOrderRepository(config),
		"quote-request": new AsAssociateQuoteRequestRepository(config),
		"shopping-list": new AsAssociateShoppingListRepository(config),
	},
	"associate-role": new AssociateRoleRepository(config),
	"attribute-group": new AttributeGroupRepository(config),
	"business-unit": new BusinessUnitRepository(config),
	category: new CategoryRepository(config),
	cart: new CartRepository(config),
	"cart-discount": new CartDiscountRepository(config),
	customer: new CustomerRepository(config),
	channel: new ChannelRepository(config),
	"customer-group": new CustomerGroupRepository(config),
	"discount-code": new DiscountCodeRepository(config),
	"discount-group": new DiscountGroupRepository(config),
	extension: new ExtensionRepository(config),
	"inventory-entry": new InventoryEntryRepository(config),
	"key-value-document": new CustomObjectRepository(config),
	order: new OrderRepository(config),
	"order-edit": new OrderEditRepository(config),
	payment: new PaymentRepository(config),
	"my-cart": new CartRepository(config),
	"my-order": new MyOrderRepository(config),
	"my-customer": new MyCustomerRepository(config),
	"my-payment": new PaymentRepository(config),
	"my-shopping-list": new ShoppingListRepository(config),
	product: new ProductRepository(config),
	"product-type": new ProductTypeRepository(config),
	"product-discount": new ProductDiscountRepository(config),
	"product-projection": new ProductProjectionRepository(config),
	"product-selection": new ProductSelectionRepository(config),
	"product-tailoring": new ProductTailoringRepository(config),
	project: new ProjectRepository(config),
	"recurring-order": new RecurringOrderRepository(config),
	"recurrence-policy": new RecurrencePolicyRepository(config),
	review: new ReviewRepository(config),
	quote: new QuoteRepository(config),
	"quote-request": new QuoteRequestRepository(config),
	"shipping-method": new ShippingMethodRepository(config),
	"shopping-list": new ShoppingListRepository(config),
	"staged-quote": new StagedQuoteRepository(config),
	"standalone-price": new StandAlonePriceRepository(config),
	state: new StateRepository(config),
	store: new StoreRepository(config),
	subscription: new SubscriptionRepository(config),
	"tax-category": new TaxCategoryRepository(config),
	type: new TypeRepository(config),
	zone: new ZoneRepository(config),
});
