import { v4 as uuidv4 } from 'uuid'
import { ParsedQs } from 'qs'
import { Price } from '@commercetools/platform-sdk'

export type PriceSelector = {
  currency?: string
  country?: string
  customerGroup?: string
  channel?: string
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

export const getBaseResourceProperties = () => {
  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    version: 0,
  }
}

export const QueryParamsAsArray = (
  input: string | ParsedQs | string[] | ParsedQs[] | undefined
): string[] => {
  if (input == undefined) {
    return []
  }

  if (Array.isArray(input)) {
    return input as string[]
  }
  return [input] as string[]
}
