import * as ctp from '@commercetools/platform-sdk';

export type ResourceMap = {
  cart: ctp.Cart;
  'cart-discount': ctp.CartDiscount;
  category: ctp.Category;
  channel: ctp.Channel;
  customer: ctp.Customer;
  'customer-group': ctp.CustomerGroup;
  'discount-code': ctp.DiscountCode;
  extension: ctp.Extension;
  'inventory-entry': ctp.InventoryEntry;
  'key-value-document': ctp.CustomObject;
  order: ctp.Order;
  'order-edit': ctp.OrderEdit;
  payment: ctp.Payment;
  product: ctp.Product;
  'product-discount': ctp.ProductDiscount;
  'product-type': ctp.ProductType;
  review: ctp.Review;
  'shipping-method': ctp.ShippingMethod;
  'shopping-list': ctp.ShoppingList;
  state: ctp.State;
  store: ctp.Store;
  subscription: ctp.Subscription;
  'tax-category': ctp.TaxCategory;
  type: ctp.Type;
  zone: ctp.Zone;

  'customer-email-token': never,
  'customer-password-token': never
};

