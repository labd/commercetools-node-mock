import { ProductData, Product } from '@commercetools/platform-sdk'
import { applyPriceSelector } from './priceSelector'

describe('priceSelector', () => {
  let product: Product

  beforeEach(() => {
    const productData: ProductData = {
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

    product = {
      id: '7401d82f-1378-47ba-996a-85beeb87ac87',
      version: 2,
      createdAt: '2022-07-22T10:02:40.851Z',
      lastModifiedAt: '2022-07-22T10:02:44.427Z',
      productType: {
        typeId: 'product-type',
        id: 'b9b4b426-938b-4ccb-9f36-c6f933e8446e',
      },
      masterData: {
        current: productData,
        staged: productData,
        published: true,
        hasStagedChanges: false,
      },
    }
  })

  test('currency (match)', async () => {
    applyPriceSelector([product], { currency: 'EUR' })

    expect(product).toMatchObject({
      masterData: {
        current: {
          masterVariant: {
            sku: 'MYSKU',
            scopedPrice: { value: { centAmount: 1789 } },
          },
        },
        staged: {
          masterVariant: {
            sku: 'MYSKU',
            scopedPrice: { value: { centAmount: 1789 } },
          },
        },
      },
    })
  })

  test('currency, country (no match)', async () => {
    applyPriceSelector([product], { currency: 'EUR', country: 'US' })
    expect(product.masterData.current.masterVariant.scopedPrice).toBeUndefined()
    expect(product.masterData.staged.masterVariant.scopedPrice).toBeUndefined()
  })
})
