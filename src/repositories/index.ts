import type { Config } from "~src/config";
import { ProductTailoringRepository } from "~src/repositories/product-tailoring";
import {
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
} from "./as-associate";
import { AssociateRoleRepository } from "./associate-role";
import { AttributeGroupRepository } from "./attribute-group";
import { BusinessUnitRepository } from "./business-unit";
import { CartRepository } from "./cart";
import { CartDiscountRepository } from "./cart-discount";
import { CategoryRepository } from "./category";
import { ChannelRepository } from "./channel";
import { CustomObjectRepository } from "./custom-object";
import { CustomerRepository } from "./customer";
import { CustomerGroupRepository } from "./customer-group";
import { DiscountCodeRepository } from "./discount-code";
import { ExtensionRepository } from "./extension";
import { InventoryEntryRepository } from "./inventory-entry";
import { MyCustomerRepository } from "./my-customer";
import { MyOrderRepository } from "./my-order";
import { OrderRepository } from "./order";
import { OrderEditRepository } from "./order-edit";
import { PaymentRepository } from "./payment";
import { ProductRepository } from "./product";
import { ProductDiscountRepository } from "./product-discount";
import { ProductProjectionRepository } from "./product-projection";
import { ProductSelectionRepository } from "./product-selection";
import { ProductTypeRepository } from "./product-type";
import { ProjectRepository } from "./project";
import { QuoteRepository } from "./quote";
import { QuoteRequestRepository } from "./quote-request";
import { StagedQuoteRepository } from "./quote-staged";
import { ReviewRepository } from "./review";
import { ShippingMethodRepository } from "./shipping-method";
import { ShoppingListRepository } from "./shopping-list";
import { StandAlonePriceRepository } from "./standalone-price";
import { StateRepository } from "./state";
import { StoreRepository } from "./store";
import { SubscriptionRepository } from "./subscription";
import { TaxCategoryRepository } from "./tax-category";
import { TypeRepository } from "./type";
import { ZoneRepository } from "./zone";

export type RepositoryMap = ReturnType<typeof createRepositories>;

export const createRepositories = (config: Config) => ({
	"as-associate": {
		cart: new AsAssociateCartRepository(config),
		order: new AsAssociateOrderRepository(config),
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
