import assert from 'assert';
import {
  Cart,
  CustomLineItem,
  CustomLineItemDraft,
  LineItem,
  LineItemImportDraft,
  Order,
  OrderChangeOrderStateAction,
  OrderChangePaymentStateAction,
  OrderFromCartDraft,
  OrderImportDraft,
  OrderSetBillingAddressAction,
  OrderSetCustomerEmailAction,
  OrderSetCustomFieldAction,
  OrderSetCustomTypeAction,
  OrderSetLocaleAction,
  OrderSetOrderNumberAction,
  OrderSetShippingAddressAction,
  OrderSetStoreAction,
  Product,
  ProductVariant,
  ReferenceTypeId,
  Store,
} from '@commercetools/platform-sdk';
import AbstractRepository from './abstract';
import {
  createCustomFields,
  createPrice,
  createTypedMoney,
  resolveStoreReference,
} from './helpers';
import { Writable } from '../types';

export class OrderRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'order';
  }

  create(draft: OrderFromCartDraft): Order {
    assert(draft.cart);

    const cart = this._storage.getByResourceIdentifier(
      draft.cart
    ) as Cart | null;
    if (!cart) {
      throw new Error('Cannot find cart');
    }

    const resource: Order = {
      ...this.getResourceProperties(),
      orderState: 'Open',
      lineItems: [],
      customLineItems: [],
      totalPrice: cart.totalPrice,
      refusedGifts: [],
      origin: 'Customer',
      syncInfo: [],
      lastMessageSequenceNumber: 0,
    };
    this.save(resource);
    return resource;
  }

  import(draft: OrderImportDraft): Order {
    // TODO: Check if order with given orderNumber already exists
    assert(this);
    const resource: Order = {
      ...this.getResourceProperties(),

      billingAddress: draft.billingAddress,
      shippingAddress: draft.shippingAddress,

      custom: createCustomFields(draft.custom, this._storage),
      customerEmail: draft.customerEmail,
      lastMessageSequenceNumber: 0,
      orderNumber: draft.orderNumber,
      orderState: draft.orderState || 'Open',
      origin: draft.origin || 'Customer',
      refusedGifts: [],
      store: resolveStoreReference(draft.store, this._storage),
      syncInfo: [],

      lineItems:
        draft.lineItems?.map(this.lineItemFromImportDraft.bind(this)) || [],
      customLineItems:
        draft.customLineItems?.map(
          this.customLineItemFromImportDraft.bind(this)
        ) || [],

      totalPrice: {
        type: 'centPrecision',
        ...draft.totalPrice,
        fractionDigits: 2,
      },
    };
    this.save(resource);
    return resource;
  }

  private lineItemFromImportDraft(draft: LineItemImportDraft): LineItem {
    let product: Product;
    let variant: ProductVariant;

    // TODO: We need to look up the product. Need to implement this. For now
    // create a dummy product
    if (draft.variant.sku) {
      variant = {
        id: 0,
        sku: draft.variant.sku,
      };

      product = {
        ...this.getResourceProperties(),
        productType: {
          typeId: 'product-type',
          id: 'dummy',
        },
        masterData: {
          published: true,
          staged: {
            name: draft.name,
            categories: [],
            slug: { 'nl-NL': 'todo' },
            masterVariant: variant,
            variants: [],
            searchKeywords: {},
          },
          current: {
            name: draft.name,
            categories: [],
            slug: { 'nl-NL': 'todo' },
            masterVariant: variant,
            variants: [],
            searchKeywords: {},
          },
          hasStagedChanges: false,
        },
      };
    } else {
      throw new Error('No product found');
    }

    const lineItem: LineItem = {
      ...this.getResourceProperties(),
      custom: createCustomFields(draft.custom, this._storage),
      discountedPricePerQuantity: [],
      lineItemMode: 'Standard',
      name: draft.name,
      price: createPrice(draft.price),
      priceMode: 'Platform',
      productId: product.id,
      productType: product.productType,
      quantity: draft.quantity,
      state: draft.state || [],
      taxRate: draft.taxRate,
      totalPrice: createTypedMoney(draft.price.value),
      variant: {
        id: variant.id,
        sku: variant.sku,
        price: createPrice(draft.price),
      },
    };

    return lineItem;
  }

  private customLineItemFromImportDraft(
    draft: CustomLineItemDraft
  ): CustomLineItem {
    const lineItem: CustomLineItem = {
      ...this.getResourceProperties(),
      custom: createCustomFields(draft.custom, this._storage),
      discountedPricePerQuantity: [],
      money: createTypedMoney(draft.money),
      name: draft.name,
      quantity: draft.quantity,
      slug: draft.slug,
      state: [],
      totalPrice: createTypedMoney(draft.money),
    };

    return lineItem;
  }

  getWithOrderNumber(orderNumber: string): Order | undefined {
    const items = this._storage.all(this.getTypeId()) as Array<Order>;
    return items.find(item => item.orderNumber == orderNumber);
  }

  actions = {
    changeOrderState: (
      resource: Writable<Order>,
      { orderState }: OrderChangeOrderStateAction
    ) => {
      resource.orderState = orderState;
    },
    changePaymentState: (
      resource: Writable<Order>,
      { paymentState }: OrderChangePaymentStateAction
    ) => {
      resource.paymentState = paymentState;
    },
    setBillingAddress: (
      resource: Writable<Order>,
      { address }: OrderSetBillingAddressAction
    ) => {
      resource.billingAddress = address;
    },
    setCustomerEmail: (
      resource: Writable<Order>,
      { email }: OrderSetCustomerEmailAction
    ) => {
      resource.customerEmail = email;
    },
    setCustomField: (
      resource: Order,
      { name, value }: OrderSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field');
      }
      resource.custom.fields[name] = value;
    },
    setCustomType: (
      resource: Writable<Order>,
      { type, fields }: OrderSetCustomTypeAction
    ) => {
      if (!type) {
        resource.custom = undefined;
      } else {
        const resolvedType = this._storage.getByResourceIdentifier(type);
        if (!resolvedType) {
          throw new Error(`Type ${type} not found`);
        }

        resource.custom = {
          type: {
            typeId: 'type',
            id: resolvedType.id,
          },
          fields: fields || [],
        };
      }
    },
    setLocale: (
      resource: Writable<Order>,
      { locale }: OrderSetLocaleAction
    ) => {
      resource.locale = locale;
    },
    setOrderNumber: (
      resource: Writable<Order>,
      { orderNumber }: OrderSetOrderNumberAction
    ) => {
      resource.orderNumber = orderNumber;
    },
    setShippingAddress: (
      resource: Writable<Order>,
      { address }: OrderSetShippingAddressAction
    ) => {
      resource.shippingAddress = address;
    },
    setStore: (resource: Writable<Order>, { store }: OrderSetStoreAction) => {
      if (!store) return;
      const resolvedType = this._storage.getByResourceIdentifier(store);
      if (!resolvedType) {
        throw new Error(`No store found with key=${store.key}`);
      }

      const storeReference = resolvedType as Store;
      resource.store = {
        typeId: 'store',
        key: storeReference.key,
      };
    },
  };
}
