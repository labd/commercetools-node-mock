import type { createRepositories } from "../repositories";
import { AsAssociateService } from "./as-associate";
import { AssociateRoleServices } from "./associate-roles";
import { AttributeGroupService } from "./attribute-group";
import { BusinessUnitServices } from "./business-units";
import { CartService } from "./cart";
import { CartDiscountService } from "./cart-discount";
import { CategoryServices } from "./category";
import { ChannelService } from "./channel";
import { CustomObjectService } from "./custom-object";
import { CustomerService } from "./customer";
import { CustomerGroupService } from "./customer-group";
import { DiscountCodeService } from "./discount-code";
import { ExtensionServices } from "./extension";
import { InventoryEntryService } from "./inventory-entry";
import { MyBusinessUnitService } from "./my-business-unit";
import { MyCartService } from "./my-cart";
import { MyCustomerService } from "./my-customer";
import { MyOrderService } from "./my-order";
import { MyPaymentService } from "./my-payment";
import { MyShoppingListService } from "./my-shopping-list";
import { OrderService } from "./order";
import { PaymentService } from "./payment";
import { ProductService } from "./product";
import { ProductDiscountService } from "./product-discount";
import { ProductProjectionService } from "./product-projection";
import { ProductSelectionService } from "./product-selection";
import { ProductTypeService } from "./product-type";
import { QuoteService } from "./quote";
import { QuoteRequestService } from "./quote-request";
import { StagedQuoteService } from "./quote-staged";
import { ReviewService } from "./reviews";
import { ShippingMethodService } from "./shipping-method";
import { ShoppingListService } from "./shopping-list";
import { StandAlonePriceService } from "./standalone-price";
import { StateService } from "./state";
import { StoreService } from "./store";
import { SubscriptionService } from "./subscription";
import { TaxCategoryService } from "./tax-category";
import { TypeService } from "./type";
import { ZoneService } from "./zone";

export const createServices = (
	router: any,
	repos: ReturnType<typeof createRepositories>,
) => ({
	"associate-role": new AssociateRoleServices(router, repos["associate-role"]),
	"as-associate": new AsAssociateService(router, repos["as-associate"]),
	"business-unit": new BusinessUnitServices(router, repos["business-unit"]),
	"category": new CategoryServices(router, repos["category"]),
	"cart": new CartService(router, repos["cart"], repos["order"]),
	"cart-discount": new CartDiscountService(router, repos["cart-discount"]),
	"customer": new CustomerService(router, repos["customer"]),
	"channel": new ChannelService(router, repos["channel"]),
	"customer-group": new CustomerGroupService(router, repos["customer-group"]),
	"discount-code": new DiscountCodeService(router, repos["discount-code"]),
	"extension": new ExtensionServices(router, repos["extension"]),
	"inventory-entry": new InventoryEntryService(
		router,
		repos["inventory-entry"],
	),
	"key-value-document": new CustomObjectService(
		router,
		repos["key-value-document"],
	),
	"order": new OrderService(router, repos["order"]),
	"payment": new PaymentService(router, repos["payment"]),
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
	"product": new ProductService(router, repos["product"]),
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
	"quotes": new QuoteService(router, repos["quote"]),
	"quote-request": new QuoteRequestService(router, repos["quote-request"]),
	"reviews": new ReviewService(router, repos["review"]),
	"shopping-list": new ShoppingListService(router, repos["shopping-list"]),
	"staged-quote": new StagedQuoteService(router, repos["staged-quote"]),
	"state": new StateService(router, repos["state"]),
	"store": new StoreService(router, repos["store"]),
	"subscription": new SubscriptionService(router, repos["subscription"]),
	"tax-category": new TaxCategoryService(router, repos["tax-category"]),
	"attribute-group": new AttributeGroupService(
		router,
		repos["attribute-group"],
	),
	"type": new TypeService(router, repos["type"]),
	"zone": new ZoneService(router, repos["zone"]),
});
