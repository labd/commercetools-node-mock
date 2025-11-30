import type * as ctp from "@commercetools/platform-sdk";
import type { RepositoryMap } from "./repositories/index.ts";

export const isType = <T>(x: T) => x;

type Builtin =
	| string
	| number
	| boolean
	| undefined
	| null
	| symbol
	| bigint
	| Date
	| RegExp;

export type Writable<T> = T extends Builtin
	? T
	: T extends ReadonlyArray<infer U>
		? WritableArray<U>
		: T extends object
			? { -readonly [P in keyof T]: Writable<T[P]> }
			: T;

export interface WritableArray<T> extends Array<Writable<T>> {}

export type ShallowWritable<T> = { -readonly [P in keyof T]: T[P] };

export type ServiceTypes =
	| ctp.ReferenceTypeId
	| "product-projection"
	| "product-search"
	| "my-cart"
	| "my-order"
	| "my-payment"
	| "my-customer"
	| "my-business-unit";

export type ResourceType = keyof ResourceMap & keyof RepositoryMap;

export type ResourceMap = {
	"attribute-group": ctp.AttributeGroup;
	"associate-role": ctp.AssociateRole;
	"business-unit": ctp.BusinessUnit;
	"cart-discount": ctp.CartDiscount;
	cart: ctp.Cart;
	category: ctp.Category;
	channel: ctp.Channel;
	"customer-email-token": never;
	"customer-group": ctp.CustomerGroup;
	"customer-password-token": never;
	customer: ctp.Customer;
	"discount-code": ctp.DiscountCode;
	"discount-group": ctp.DiscountGroup;
	extension: ctp.Extension;
	"inventory-entry": ctp.InventoryEntry;
	"key-value-document": ctp.CustomObject;
	"order-edit": ctp.OrderEdit;
	order: ctp.Order;
	payment: ctp.Payment;
	"product-discount": ctp.ProductDiscount;
	"product-price": ctp.StandalonePrice;
	"product-projection": ctp.ProductProjection;
	"product-selection": ctp.ProductSelection;
	"product-tailoring": ctp.ProductTailoring;
	"product-type": ctp.ProductType;
	product: ctp.Product;
	"quote-request": ctp.QuoteRequest;
	quote: ctp.Quote;
	review: ctp.Review;
	"shipping-method": ctp.ShippingMethod;
	"shopping-list": ctp.ShoppingList;
	"staged-quote": ctp.StagedQuote;
	"standalone-price": ctp.StandalonePrice;
	state: ctp.State;
	store: ctp.Store;
	subscription: ctp.Subscription;
	"recurring-order": ctp.RecurringOrder;
	"recurrence-policy": ctp.RecurrencePolicy;
	"tax-category": ctp.TaxCategory;
	type: ctp.Type;
	zone: ctp.Zone;
};

export type PagedQueryResponseMap = {
	"attribute-group": ctp.AttributeGroupPagedQueryResponse;
	"associate-role": ctp.AssociateRolePagedQueryResponse;
	"business-unit": ctp.BusinessUnitPagedQueryResponse;
	"cart-discount": ctp.CartDiscountPagedQueryResponse;
	cart: ctp.CartPagedQueryResponse;
	category: ctp.CategoryPagedQueryResponse;
	channel: ctp.ChannelPagedQueryResponse;
	"customer-email-token": never;
	"customer-group": ctp.CustomerGroupPagedQueryResponse;
	"customer-password-token": never;
	customer: ctp.CustomerPagedQueryResponse;
	"discount-code": ctp.DiscountCodePagedQueryResponse;
	"discount-group": ctp.DiscountGroupPagedQueryResponse;
	extension: ctp.ExtensionPagedQueryResponse;
	"inventory-entry": ctp.InventoryPagedQueryResponse;
	"key-value-document": ctp.CustomObjectPagedQueryResponse;
	"order-edit": ctp.OrderEditPagedQueryResponse;
	order: ctp.OrderPagedQueryResponse;
	payment: ctp.PaymentPagedQueryResponse;
	"product-discount": ctp.ProductDiscountPagedQueryResponse;
	"product-price": ctp.StandalonePricePagedQueryResponse;
	"product-projection": ctp.ProductProjectionPagedQueryResponse;
	"product-selection": ctp.ProductSelectionPagedQueryResponse;
	"product-tailoring": ctp.ProductTailoringPagedQueryResponse;
	"product-type": ctp.ProductTypePagedQueryResponse;
	product: ctp.ProductPagedQueryResponse;
	"quote-request": ctp.QuoteRequestPagedQueryResponse;
	quote: ctp.QuotePagedQueryResponse;
	review: ctp.ReviewPagedQueryResponse;
	"shipping-method": ctp.ShippingMethodPagedQueryResponse;
	"shopping-list": ctp.ShoppingListPagedQueryResponse;
	"staged-quote": ctp.StagedQuotePagedQueryResponse;
	"standalone-price": ctp.StandalonePricePagedQueryResponse;
	state: ctp.StatePagedQueryResponse;
	store: ctp.StorePagedQueryResponse;
	subscription: ctp.SubscriptionPagedQueryResponse;
	"recurring-order": ctp.RecurringOrderPagedQueryResponse;
	"recurrence-policy": ctp.RecurrencePolicyPagedQueryResponse;
	"tax-category": ctp.TaxCategoryPagedQueryResponse;
	type: ctp.TypePagedQueryResponse;
	zone: ctp.ZonePagedQueryResponse;
};
