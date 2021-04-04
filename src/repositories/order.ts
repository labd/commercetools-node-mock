import assert from 'assert';
import {
  Cart,
  Order,
  OrderChangeOrderStateAction,
  OrderChangePaymentStateAction,
  OrderFromCartDraft,
  OrderSetCustomFieldAction,
  OrderSetLocaleAction,
  OrderSetOrderNumberAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk';
import AbstractRepository from './abstract';

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
