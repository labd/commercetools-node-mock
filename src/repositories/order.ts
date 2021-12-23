import assert from 'assert'
import {
  Cart,
  CustomLineItem,
  CustomLineItemDraft,
  GeneralError,
  LineItem,
  LineItemImportDraft,
  Order,
  OrderAddPaymentAction,
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
  ProductPagedQueryResponse,
  ProductVariant,
  ReferenceTypeId,
  Store,
} from '@commercetools/platform-sdk'
import { AbstractResourceRepository, QueryParams } from './abstract'
import {
  createCustomFields,
  createPrice,
  createTypedMoney,
  resolveStoreReference,
} from './helpers'
import { Writable } from '../types'
import { getBaseResourceProperties } from '../helpers'
import { CommercetoolsError } from '../exceptions'

export class OrderRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'order'
  }

  create(projectKey: string, draft: OrderFromCartDraft): Order {
    assert(draft.cart, 'draft.cart is missing')

    const cart = this._storage.getByResourceIdentifier(
      projectKey,
      draft.cart
    ) as Cart | null
    if (!cart) {
      throw new Error('Cannot find cart')
    }

    const resource: Order = {
      ...getBaseResourceProperties(),
      orderNumber: draft.orderNumber,
      orderState: 'Open',
      lineItems: [],
      customLineItems: [],
      totalPrice: cart.totalPrice,
      refusedGifts: [],
      origin: 'Customer',
      syncInfo: [],
      lastMessageSequenceNumber: 0,
    }
    this.save(projectKey, resource)
    return resource
  }

  import(projectKey: string, draft: OrderImportDraft): Order {
    // TODO: Check if order with given orderNumber already exists
    assert(this, 'OrderRepository not valid')
    const resource: Order = {
      ...getBaseResourceProperties(),

      billingAddress: draft.billingAddress,
      shippingAddress: draft.shippingAddress,

      custom: createCustomFields(draft.custom, projectKey, this._storage),
      customerEmail: draft.customerEmail,
      lastMessageSequenceNumber: 0,
      orderNumber: draft.orderNumber,
      orderState: draft.orderState || 'Open',
      origin: draft.origin || 'Customer',
      paymentState: draft.paymentState,
      refusedGifts: [],
      store: resolveStoreReference(draft.store, projectKey, this._storage),
      syncInfo: [],

      lineItems:
        draft.lineItems?.map(item =>
          this.lineItemFromImportDraft.bind(this)(projectKey, item)
        ) || [],
      customLineItems:
        draft.customLineItems?.map(item =>
          this.customLineItemFromImportDraft.bind(this)(projectKey, item)
        ) || [],

      totalPrice: {
        type: 'centPrecision',
        ...draft.totalPrice,
        fractionDigits: 2,
      },
    }
    this.save(projectKey, resource)
    return resource
  }

  private lineItemFromImportDraft(
    projectKey: string,
    draft: LineItemImportDraft
  ): LineItem {
    let product: Product
    let variant: ProductVariant | undefined

    if (draft.variant.sku) {
      variant = {
        id: 0,
        sku: draft.variant.sku,
      }

      var items = this._storage.query(projectKey, 'product', {
        where: [
          `masterData(current(masterVariant(sku="${draft.variant.sku}"))) or masterData(current(variants(sku="${draft.variant.sku}")))`,
        ],
      }) as ProductPagedQueryResponse

      if (items.count !== 1) {
        throw new CommercetoolsError<GeneralError>({
          code: 'General',
          message: `A product containing a variant with SKU '${draft.variant.sku}' not found.`,
        })
      }

      product = items.results[0]
      if (product.masterData.current.masterVariant.sku === draft.variant.sku) {
        variant = product.masterData.current.masterVariant
      } else {
        variant = product.masterData.current.variants.find(
          v => v.sku === draft.variant.sku
        )
      }
      if (!variant) {
        throw new Error('Internal state error')
      }
    } else {
      throw new Error('No product found')
    }

    const lineItem: LineItem = {
      ...getBaseResourceProperties(),
      custom: createCustomFields(draft.custom, projectKey, this._storage),
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
    }

    return lineItem
  }

  private customLineItemFromImportDraft(
    projectKey: string,
    draft: CustomLineItemDraft
  ): CustomLineItem {
    const lineItem: CustomLineItem = {
      ...getBaseResourceProperties(),
      custom: createCustomFields(draft.custom, projectKey, this._storage),
      discountedPricePerQuantity: [],
      money: createTypedMoney(draft.money),
      name: draft.name,
      quantity: draft.quantity,
      slug: draft.slug,
      state: [],
      totalPrice: createTypedMoney(draft.money),
    }

    return lineItem
  }

  getWithOrderNumber(
    projectKey: string,
    orderNumber: string,
    params: QueryParams = {}
  ): Order | undefined {
    const result = this._storage.query(projectKey, this.getTypeId(), {
      ...params,
      where: [`orderNumber="${orderNumber}"`],
    })
    if (result.count === 1) {
      return result.results[0] as Order
    }

    // Catch this for now, should be checked when creating/updating
    if (result.count > 1) {
      throw new Error('Duplicate order numbers')
    }

    return
  }

  actions = {
    addPayment: (
      projectKey: string,
      resource: Writable<Order>,
      { payment }: OrderAddPaymentAction
    ) => {
      const resolvedPayment = this._storage.getByResourceIdentifier(
        projectKey,
        payment
      )
      if (!resolvedPayment) {
        throw new Error(`Payment ${payment.id} not found`)
      }

      if (!resource.paymentInfo) {
        resource.paymentInfo = {
          payments: [],
        }
      }

      resource.paymentInfo.payments.push({
        typeId: 'payment',
        id: payment.id!,
      })
    },
    changeOrderState: (
      projectKey: string,
      resource: Writable<Order>,
      { orderState }: OrderChangeOrderStateAction
    ) => {
      resource.orderState = orderState
    },
    changePaymentState: (
      projectKey: string,
      resource: Writable<Order>,
      { paymentState }: OrderChangePaymentStateAction
    ) => {
      resource.paymentState = paymentState
    },
    setBillingAddress: (
      projectKey: string,
      resource: Writable<Order>,
      { address }: OrderSetBillingAddressAction
    ) => {
      resource.billingAddress = address
    },
    setCustomerEmail: (
      projectKey: string,
      resource: Writable<Order>,
      { email }: OrderSetCustomerEmailAction
    ) => {
      resource.customerEmail = email
    },
    setCustomField: (
      projectKey: string,
      resource: Order,
      { name, value }: OrderSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }
      resource.custom.fields[name] = value
    },
    setCustomType: (
      projectKey: string,
      resource: Writable<Order>,
      { type, fields }: OrderSetCustomTypeAction
    ) => {
      if (!type) {
        resource.custom = undefined
      } else {
        const resolvedType = this._storage.getByResourceIdentifier(
          projectKey,
          type
        )
        if (!resolvedType) {
          throw new Error(`Type ${type} not found`)
        }

        resource.custom = {
          type: {
            typeId: 'type',
            id: resolvedType.id,
          },
          fields: fields || [],
        }
      }
    },
    setLocale: (
      projectKey: string,
      resource: Writable<Order>,
      { locale }: OrderSetLocaleAction
    ) => {
      resource.locale = locale
    },
    setOrderNumber: (
      projectKey: string,
      resource: Writable<Order>,
      { orderNumber }: OrderSetOrderNumberAction
    ) => {
      resource.orderNumber = orderNumber
    },
    setShippingAddress: (
      projectKey: string,
      resource: Writable<Order>,
      { address }: OrderSetShippingAddressAction
    ) => {
      resource.shippingAddress = address
    },
    setStore: (
      projectKey: string,
      resource: Writable<Order>,
      { store }: OrderSetStoreAction
    ) => {
      if (!store) return
      const resolvedType = this._storage.getByResourceIdentifier(
        projectKey,
        store
      )
      if (!resolvedType) {
        throw new Error(`No store found with key=${store.key}`)
      }

      const storeReference = resolvedType as Store
      resource.store = {
        typeId: 'store',
        key: storeReference.key,
      }
    },
  }
}
