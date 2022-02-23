import {
  Cart,
  CartAddLineItemAction,
  CartDraft,
  CartSetBillingAddressAction,
  CartSetCountryAction,
  CartSetCustomerEmailAction,
  CartSetCustomFieldAction,
  CartSetCustomTypeAction,
  CartSetLocaleAction,
  CartSetShippingAddressAction,
  GeneralError,
  Product,
  ProductPagedQueryResponse,
  ProductVariant,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { createCustomFields } from './helpers'
import { Writable } from '../types'
import { CommercetoolsError } from '../exceptions'

export class CartRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart'
  }

  create(projectKey: string, draft: CartDraft): Cart {
    const resource: Cart = {
      ...getBaseResourceProperties(),
      cartState: 'Active',
      lineItems: [],
      customLineItems: [],
      totalPrice: {
        type: 'centPrecision',
        centAmount: 0,
        currencyCode: draft.currency,
        fractionDigits: 0,
      },
      taxMode: 'Platform',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',
      refusedGifts: [],
      origin: 'Customer',
      custom: createCustomFields(draft.custom, projectKey, this._storage),
    }
    this.save(projectKey, resource)
    return resource
  }

  getActiveCart(projectKey: string): Cart | undefined {
    // Get first active cart
    const results = this._storage.query(projectKey, this.getTypeId(), {
      where: [`cartState="Active"`],
    })
    if (results.count > 0) {
      return results.results[0] as Cart
    }

    return
  }

  actions = {
    addLineItem: (
      projectKey: string,
      resource: Writable<Cart>,
      { productId, variantId, sku, quantity = 1 }: CartAddLineItemAction
    ) => {
      let product: Product | null = null
      let variant: ProductVariant | undefined

      if (productId && variantId) {
        // Fetch product and variant by ID
        product = this._storage.get(projectKey, 'product', productId, {})
      } else if (sku) {
        // Fetch product and variant by SKU
        const items = this._storage.query(projectKey, 'product', {
          where: [
            `masterData(current(masterVariant(sku="${sku}"))) or masterData(current(variants(sku="${sku}")))`,
          ],
        }) as ProductPagedQueryResponse

        if (items.count === 1) {
          product = items.results[0]
        }
      }

      if (!product) {
        // Check if product is found
        throw new CommercetoolsError<GeneralError>({
          code: 'General',
          message: sku
            ? `A product containing a variant with SKU '${sku}' not found.`
            : `A product with ID '${productId}' not found.`,
        })
      }

      // Find matching variant
      variant = [
        product.masterData.current.masterVariant,
        ...product.masterData.current.variants,
      ].find((x) => {
        if (sku) return x.sku === sku
        if (variantId) return x.id === variantId
        return false
      })

      if (!variant) {
        // Check if variant is found
        throw new CommercetoolsError<GeneralError>({
          code: 'General',
          message: sku
            ? `A variant with SKU '${sku}' for product '${product.id}' not found.`
            : `A variant with ID '${variantId}' for product '${product.id}' not found.`,
        })
      }

      const alreadyAdded = resource.lineItems.some(
        (x) => x.productId === product?.id && x.variant.id === variant?.id
      )
      if (alreadyAdded) {
        // increase quantity
        resource.lineItems.map((x) => {
          if (x.productId === product?.id && x.variant.id === variant?.id) {
            // update quantity and total price
            x.quantity += quantity
            x.totalPrice.centAmount = x.price!.value.centAmount * x.quantity
          }
          return x
        })
      } else {
        // add line item
        if (!variant.prices?.length) {
          throw new CommercetoolsError<GeneralError>({
            code: 'General',
            message: `A product with ID '${productId}' doesn't have any prices.`,
          })
        }

        const price = variant.prices[0]
        resource.lineItems.push({
          id: uuidv4(),
          productId: product.id,
          productKey: product.key,
          name: product.masterData.current.name,
          productSlug: product.masterData.current.slug,
          productType: product.productType,
          variant,
          price: price,
          totalPrice: {
            ...price.value,
            centAmount: price.value.centAmount * quantity,
          },
          quantity,
          discountedPricePerQuantity: [],
          lineItemMode: 'Standard',
          priceMode: 'Platform',
          state: [],
        })
      }

      // Update cart total price
      resource.totalPrice.centAmount = resource.lineItems.reduce(
        (cur, item) => cur + item.totalPrice.centAmount,
        0
      )
    },
    setBillingAddress: (
      projectKey: string,
      resource: Writable<Cart>,
      { address }: CartSetBillingAddressAction
    ) => {
      resource.billingAddress = address
    },
    setCountry: (
      projectKey: string,
      resource: Writable<Cart>,
      { country }: CartSetCountryAction
    ) => {
      resource.country = country
    },
    setCustomerEmail: (
      projectKey: string,
      resource: Writable<Cart>,
      { email }: CartSetCustomerEmailAction
    ) => {
      resource.customerEmail = email
    },
    setCustomField: (
      projectKey: string,
      resource: Cart,
      { name, value }: CartSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }
      resource.custom.fields[name] = value
    },
    setCustomType: (
      projectKey: string,
      resource: Writable<Cart>,
      { type, fields }: CartSetCustomTypeAction
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
      resource: Writable<Cart>,
      { locale }: CartSetLocaleAction
    ) => {
      resource.locale = locale
    },
    setShippingAddress: (
      projectKey: string,
      resource: Writable<Cart>,
      { address }: CartSetShippingAddressAction
    ) => {
      resource.shippingAddress = address
    },
  }
}
