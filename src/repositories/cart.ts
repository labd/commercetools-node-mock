import {
  Cart,
  CartAddLineItemAction,
  CartDraft,
  CartRemoveLineItemAction,
  CartSetBillingAddressAction,
  CartSetCountryAction,
  CartSetCustomerEmailAction,
  CartSetCustomFieldAction,
  CartSetCustomTypeAction,
  CartSetLocaleAction,
  CartSetShippingAddressAction,
  CartSetShippingMethodAction,
  GeneralError,
  LineItem,
  LineItemDraft,
  Price,
  Product,
  ProductPagedQueryResponse,
  ProductVariant,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { createCustomFields } from './helpers'
import { Writable } from '../types'
import { CommercetoolsError } from '../exceptions'

export class CartRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart'
  }

  create(context: RepositoryContext, draft: CartDraft): Cart {
    const lineItems =
      draft.lineItems?.map(draftLineItem =>
        this.draftLineItemtoLineItem(
          context.projectKey,
          draftLineItem,
          draft.currency,
          draft.country
        )
      ) ?? []

    const resource: Cart = {
      ...getBaseResourceProperties(),
      cartState: 'Active',
      lineItems,
      customLineItems: [],
      totalPrice: {
        type: 'centPrecision',
        centAmount: 0,
        currencyCode: draft.currency,
        fractionDigits: 0,
      },
      taxMode: draft.taxMode ?? 'Platform',
      taxRoundingMode: draft.taxRoundingMode ?? 'HalfEven',
      taxCalculationMode: draft.taxCalculationMode ?? 'LineItemLevel',
      refusedGifts: [],
      locale: draft.locale,
      country: draft.country,
      origin: draft.origin ?? 'Customer',
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
    }

    // @ts-ignore
    resource.totalPrice.centAmount = calculateCartTotalPrice(resource)

    this.saveNew(context, resource)
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
      context: RepositoryContext,
      resource: Writable<Cart>,
      { productId, variantId, sku, quantity = 1 }: CartAddLineItemAction
    ) => {
      let product: Product | null = null
      let variant: ProductVariant | undefined

      if (productId && variantId) {
        // Fetch product and variant by ID
        product = this._storage.get(
          context.projectKey,
          'product',
          productId,
          {}
        )
      } else if (sku) {
        // Fetch product and variant by SKU
        const items = this._storage.query(context.projectKey, 'product', {
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
      ].find(x => {
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
        x => x.productId === product?.id && x.variant.id === variant?.id
      )
      if (alreadyAdded) {
        // increase quantity and update total price
        resource.lineItems.map(x => {
          if (x.productId === product?.id && x.variant.id === variant?.id) {
            x.quantity += quantity
            x.totalPrice.centAmount = calculateLineItemTotalPrice(x)
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

        const currency = resource.totalPrice.currencyCode

        const price = selectPrice({
          prices: variant.prices,
          currency,
          country: resource.country,
        })
        if (!price) {
          throw new Error(
            `No valid price found for ${productId} for country ${resource.country} and currency ${currency}`
          )
        }
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
      resource.totalPrice.centAmount = calculateCartTotalPrice(resource)
    },
    removeLineItem: (
      context: RepositoryContext,
      resource: Writable<Cart>,
      { lineItemId, quantity }: CartRemoveLineItemAction
    ) => {
      const lineItem = resource.lineItems.find(x => x.id === lineItemId)
      if (!lineItem) {
        // Check if product is found
        throw new CommercetoolsError<GeneralError>({
          code: 'General',
          message: `A line item with ID '${lineItemId}' not found.`,
        })
      }

      const shouldDelete = !quantity || quantity >= lineItem.quantity
      if (shouldDelete) {
        // delete line item
        resource.lineItems = resource.lineItems.filter(x => x.id !== lineItemId)
      } else {
        // decrease quantity and update total price
        resource.lineItems.map(x => {
          if (x.id === lineItemId && quantity) {
            x.quantity -= quantity
            x.totalPrice.centAmount = calculateLineItemTotalPrice(x)
          }
          return x
        })
      }

      // Update cart total price
      resource.totalPrice.centAmount = calculateCartTotalPrice(resource)
    },
    setBillingAddress: (
      context: RepositoryContext,
      resource: Writable<Cart>,
      { address }: CartSetBillingAddressAction
    ) => {
      resource.billingAddress = address
    },
    setShippingMethod: (
      context: RepositoryContext,
      resource: Writable<Cart>,
      { shippingMethod }: CartSetShippingMethodAction
    ) => {
      const resolvedType = this._storage.getByResourceIdentifier(
        context.projectKey,
        //@ts-ignore
        shippingMethod
      )

      if (!resolvedType) {
        throw new Error(`Type ${shippingMethod} not found`)
      }
      //@ts-ignore
      resource.shippingInfo = {
        shippingMethod: {
          typeId: 'shipping-method',
          id: resolvedType.id,
        },
      }
    },
    setCountry: (
      context: RepositoryContext,
      resource: Writable<Cart>,
      { country }: CartSetCountryAction
    ) => {
      resource.country = country
    },
    setCustomerEmail: (
      context: RepositoryContext,
      resource: Writable<Cart>,
      { email }: CartSetCustomerEmailAction
    ) => {
      resource.customerEmail = email
    },
    setCustomField: (
      context: RepositoryContext,
      resource: Cart,
      { name, value }: CartSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }
      resource.custom.fields[name] = value
    },
    setCustomType: (
      context: RepositoryContext,
      resource: Writable<Cart>,
      { type, fields }: CartSetCustomTypeAction
    ) => {
      if (!type) {
        resource.custom = undefined
      } else {
        const resolvedType = this._storage.getByResourceIdentifier(
          context.projectKey,
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
      context: RepositoryContext,
      resource: Writable<Cart>,
      { locale }: CartSetLocaleAction
    ) => {
      resource.locale = locale
    },
    setShippingAddress: (
      context: RepositoryContext,
      resource: Writable<Cart>,
      { address }: CartSetShippingAddressAction
    ) => {
      resource.shippingAddress = address
    },
  }
  draftLineItemtoLineItem = (
    projectKey: string,
    draftLineItem: LineItemDraft,
    currency: string,
    country: string | undefined
  ): LineItem => {
    const { productId, quantity, variantId, sku } = draftLineItem

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
    ].find(x => {
      if (sku) return x.sku === sku
      if (variantId) return x.id === variantId
      return false
    })

    if (!variant) {
      // Check if variant is found
      throw new Error(
        sku
          ? `A variant with SKU '${sku}' for product '${product.id}' not found.`
          : `A variant with ID '${variantId}' for product '${product.id}' not found.`
      )
    }

    const quant = quantity ?? 1

    const price = selectPrice({ prices: variant.prices, currency, country })
    if (!price) {
      throw new Error(
        `No valid price found for ${productId} for country ${country} and currency ${currency}`
      )
    }

    return {
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
        centAmount: price.value.centAmount * quant,
      },
      quantity: quant,
      discountedPricePerQuantity: [],
      lineItemMode: 'Standard',
      priceMode: 'Platform',
      state: [],
    }
  }
}

const selectPrice = ({
  prices,
  currency,
  country,
}: {
  prices: Price[] | undefined
  currency: string
  country: string | undefined
}) => {
  if (!prices) {
    return undefined
  }

  // Quick-and-dirty way of selecting price based on the given currency and country.
  // Can be improved later to give more priority to exact matches over
  // 'all country' matches, and include customer groups in the mix as well
  return prices.find(price => {
    const countryMatch = !price.country || price.country === country
    const currencyMatch = price.value.currencyCode === currency
    return countryMatch && currencyMatch
  })
}

const calculateLineItemTotalPrice = (lineItem: LineItem): number =>
  lineItem.price!.value.centAmount * lineItem.quantity

const calculateCartTotalPrice = (cart: Cart): number =>
  cart.lineItems.reduce((cur, item) => cur + item.totalPrice.centAmount, 0)
