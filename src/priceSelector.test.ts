import { ProductProjection } from '@commercetools/platform-sdk'
import { applyPriceSelector } from './priceSelector'
import { beforeEach, describe, expect, test } from 'vitest'

describe('priceSelector', () => {
  let product: ProductProjection

  beforeEach(() => {
    product = {
      id: '7401d82f-1378-47ba-996a-85beeb87ac87',
      version: 2,
      createdAt: '2022-07-22T10:02:40.851Z',
      lastModifiedAt: '2022-07-22T10:02:44.427Z',
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
  })

  test('currency (match)', async () => {
    applyPriceSelector([product], { currency: 'EUR' })

    expect(product).toMatchObject({
      masterVariant: {
        sku: 'MYSKU',
        scopedPrice: { value: { centAmount: 1789 } },
      },
    })
  })

  test('currency, country (no match)', async () => {
    applyPriceSelector([product], { currency: 'EUR', country: 'US' })
    expect(product.masterVariant.scopedPrice).toBeUndefined()
    expect(product.masterVariant.scopedPrice).toBeUndefined()
  })
})
