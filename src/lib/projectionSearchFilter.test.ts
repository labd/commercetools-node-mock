import { ProductProjection } from '@commercetools/platform-sdk'
import { describe, expect, test } from 'vitest'
import { cloneObject } from '../helpers'
import { applyPriceSelector } from '../priceSelector'
import { parseFilterExpression } from './projectionSearchFilter'

describe('Search filter', () => {
  const exampleProduct: ProductProjection = {
    id: '7401d82f-1378-47ba-996a-85beeb87ac87',
    version: 2,
    createdAt: '2022-07-22T10:02:40.851Z',
    lastModifiedAt: '2022-07-22T10:02:44.427Z',
    key: 'test-product',
    productType: {
      typeId: 'product-type',
      id: 'b9b4b426-938b-4ccb-9f36-c6f933e8446e',
    },
    name: {
      'nl-NL': 'test',
    },
    slug: {
      'nl-NL': 'test',
    },
    variants: [],
    searchKeywords: {},
    categories: [],
    masterVariant: {
      id: 1,
      sku: 'MYSKU',
      attributes: [
        {
          name: 'Country',
          value: {
            key: 'NL',
            label: {
              de: 'niederlande',
              en: 'netherlands',
              nl: 'nederland',
            },
          },
        },
        {
          name: 'number',
          value: 4,
        },
      ],
      prices: [
        {
          id: 'dummy-uuid',
          value: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 1789,
            fractionDigits: 2,
          },
        },
      ],
    },
  }

  const match = (pattern: string, product?: ProductProjection) => {
    const matchFunc = parseFilterExpression(pattern)
    const clone = cloneObject(product ?? exampleProduct)
    return {
      isMatch: matchFunc(clone, false),
      product: clone,
    }
  }

  test('by product key', async () => {
    expect(match(`key:exists`).isMatch).toBeTruthy()
    expect(match(`key:missing`).isMatch).toBeFalsy()
    expect(match(`key:"test-product"`).isMatch).toBeTruthy()
  })

  test('by product type id', async () => {
    expect(
      match(`productType.id:"b9b4b426-938b-4ccb-9f36-c6f933e8446e"`).isMatch
    ).toBeTruthy()
  })

  test('by SKU', async () => {
    expect(match(`variants.sku:exists`).isMatch).toBeTruthy()
    expect(match(`variants.sku:missing`).isMatch).toBeFalsy()
    expect(match(`variants.sku:"MYSKU"`).isMatch).toBeTruthy()
  })

  test('by attribute value', async () => {
    expect(match(`variants.attributes.number:4`).isMatch).toBeTruthy()
    expect(match(`variants.attributes.number:3,4`).isMatch).toBeTruthy()
    expect(match(`variants.attributes.number:3,4,5`).isMatch).toBeTruthy()
    expect(match(`variants.attributes.number:1,2,3,5`).isMatch).toBeFalsy()
  })

  test('by attribute range', async () => {
    expect(
      match(`variants.attributes.number:range (0 TO 5)`).isMatch
    ).toBeTruthy()

    expect(
      match(`variants.attributes.number:range (* TO 5)`).isMatch
    ).toBeTruthy()

    expect(
      match(`variants.attributes.number:range (* TO *)`).isMatch
    ).toBeTruthy()
  })

  test('by attribute enum key', async () => {
    expect(match(`variants.attributes.Country.key:"NL"`).isMatch).toBeTruthy()
    expect(match(`variants.attributes.Country.key:"DE"`).isMatch).toBeFalsy()
  })

  test('by attribute enum key', async () => {
    expect(match(`variants.attributes.Country.key:"NL"`).isMatch).toBeTruthy()
    expect(match(`variants.attributes.Country.key:"DE"`).isMatch).toBeFalsy()
  })

  test('by price range', async () => {
    expect(
      match(`variants.price.centAmount:range (1500 TO 2000)`).isMatch
    ).toBeTruthy()
  })

  test('by price range - or', async () => {
    expect(
      match(
        `variants.price.centAmount:range (2 TO 1500 ), (1500 TO 3000), (3000 TO 6000)`
      ).isMatch
    ).toBeTruthy()
  })

  test('by scopedPrice range', async () => {
    let result
    let products: ProductProjection[]

    // No currency given
    result = match(`variants.scopedPrice.value.centAmount:range (1500 TO 2000)`)
    expect(result.isMatch).toBeFalsy()

    // Currency match
    products = [cloneObject(exampleProduct)]
    applyPriceSelector(products, { currency: 'EUR' })

    result = match(
      `variants.scopedPrice.value.centAmount:range (1500 TO 2000)`,
      products[0]
    )
    expect(result.isMatch).toBeTruthy()
    expect(result.product).toMatchObject({
      masterVariant: {
        sku: 'MYSKU',
        scopedPrice: { value: { centAmount: 1789 } },
      },
    })

    // Currency mismatch
    products = [cloneObject(exampleProduct)]
    applyPriceSelector(products, { currency: 'USD' })

    result = match(
      `variants.scopedPrice.value.centAmount:range (1500 TO 2000)`,
      products[0]
    )
    expect(result.isMatch).toBeFalsy()

    // Price has no country so mismatch
    products = [cloneObject(exampleProduct)]
    applyPriceSelector(products, { currency: 'EUR', country: 'NL' })
    result = match(
      `variants.scopedPrice.value.centAmount:range (1500 TO 2000)`,
      products[0]
    )
    expect(result.isMatch).toBeFalsy()
  })
})
