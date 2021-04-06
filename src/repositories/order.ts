import assert from 'assert';
import {
  Cart,
  CustomFields,
  CustomFieldsDraft,
  LineItem,
  LineItemDraft,
  LineItemImportDraft,
  Order,
  OrderChangeOrderStateAction,
  OrderChangePaymentStateAction,
  OrderFromCartDraft,
  OrderImportDraft,
  OrderSetCustomFieldAction,
  OrderSetLocaleAction,
  OrderSetOrderNumberAction,
  Product,
  ProductVariant,
  ReferenceTypeId,
} from '@commercetools/platform-sdk';
import AbstractRepository from './abstract';
import { createCustomFields, createPrice, createTypedMoney } from './helpers';

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
      orderState: draft.orderState || 'Open',
      orderNumber: draft.orderNumber,
      lineItems:
        draft.lineItems?.map(this.lineItemFromImportDraft.bind(this)) || [],
      customLineItems: [],
      totalPrice: {
        type: 'centPrecision',
        ...draft.totalPrice,
        fractionDigits: 2,
      },
      refusedGifts: [],
      origin: draft.origin || 'Customer',
      syncInfo: [],
      lastMessageSequenceNumber: 0,
      custom: createCustomFields(draft.custom, this._storage),
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
      productType: product.productType,
      productId: product.id,
      variant: {
        id: variant.id,
        sku: variant.sku,
        price: createPrice(draft.price),
      },
      taxRate: draft.taxRate,
      name: draft.name,
      quantity: draft.quantity,
      price: createPrice(draft.price),
      totalPrice: createTypedMoney(draft.price),
      state: draft.state || [],
      priceMode: 'Platform',
      discountedPricePerQuantity: [],
      lineItemMode: 'Standard',
      custom: createCustomFields(draft.custom, this._storage),
    };

    return lineItem;
  }

  getWithOrderNumber(orderNumber: string): Order | undefined {
    const items = this._storage.all(this.getTypeId()) as Array<Order>;
    return items.find(item => item.orderNumber == orderNumber);
  }

  actions = {
    setOrderNumber: (
      resource: Order,
      { orderNumber }: OrderSetOrderNumberAction
    ) => {
      // @ts-ignore
      resource.orderNumber = orderNumber;
    },
    changeOrderState: (
      resource: Order,
      { orderState }: OrderChangeOrderStateAction
    ) => {
      // @ts-ignore
      resource.orderState = orderState;
    },
    changePaymentState: (
      resource: Order,
      { paymentState }: OrderChangePaymentStateAction
    ) => {
      // @ts-ignore
      resource.paymentState = paymentState;
    },
    setLocale: (resource: Order, { locale }: OrderSetLocaleAction) => {
      // @ts-ignore
      resource.locale = locale;
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
  };
}
