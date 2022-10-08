import {
  InvalidInputError,
  Price,
  Product,
  ProductProjection,
  ProductVariant,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from './exceptions'
import { Writable } from './types'

export type PriceSelector = {
  currency?: string
  country?: string
  customerGroup?: string
  channel?: string
}

/**
 * Apply the price selector on all the variants. The price selector is applied
 * on all the prices per variant and the first match per variant is stored in
 * the scopedPrice attribute
 */
export const applyPriceSelector = (
  products: ProductProjection[],
  selector: PriceSelector
) => {
  validatePriceSelector(selector)

  for (const product of products) {
    const variants: Writable<ProductVariant>[] = [
      product.masterVariant,
      ...(product.variants ?? []),
    ].filter(x => x != undefined)

    for (const variant of variants) {
      const scopedPrices =
        variant.prices?.filter(p => priceSelectorFilter(p, selector)) ?? []

      if (scopedPrices.length > 0) {
        const price = scopedPrices[0]

        variant.scopedPriceDiscounted = false
        variant.scopedPrice = {
          ...price,
          currentValue: price.value,
        }
      }
    }
  }
}

const validatePriceSelector = (selector: PriceSelector) => {
  if (
    (selector.country || selector.channel || selector.customerGroup) &&
    !selector.currency
  ) {
    throw new CommercetoolsError<InvalidInputError>(
      {
        code: 'InvalidInput',
        message:
          'The price selecting parameters country, channel and customerGroup ' +
          'cannot be used without the currency.',
      },
      400
    )
  }
}

/**
 * Return a boolean to indicate if the price matches the selector. Price
 * selection requires that if the selector or the price has a specific value
 * then it should match.
 */
export const priceSelectorFilter = (
  price: Price,
  selector: PriceSelector
): boolean => {
  if (
    (selector.country || price.country) &&
    selector.country !== price.country
  ) {
    return false
  }

  if (
    (selector.currency || price.value.currencyCode) &&
    selector.currency !== price.value.currencyCode
  ) {
    return false
  }

  if (
    (selector.channel || price.channel?.id) &&
    selector.channel !== price.channel?.id
  ) {
    return false
  }

  if (
    (selector.customerGroup || price.customerGroup?.id) &&
    selector.customerGroup !== price.customerGroup?.id
  ) {
    return false
  }

  return true
}
