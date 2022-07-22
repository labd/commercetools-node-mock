import {
  Product,
  ProductData,
  ProductProjection,
} from '@commercetools/platform-sdk'
import { parseFilterExpression } from './projectionSearchFilter'

describe('Search filter', () => {
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
    },
  }

  const exampleProduct: Product = {
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

  const match = (pattern: string) => {
    const matchFunc = parseFilterExpression(pattern, false)
    return matchFunc(exampleProduct, false)
  }

  test('by SKU', async () => {
    expect(match(`variants.sku:exists`)).toBeTruthy()
    expect(match(`variants.sku:missing`)).toBeFalsy()
    expect(match(`variants.sku:"MYSKU"`)).toBeTruthy()
  })

  test('by attribute value', async () => {
    expect(match(`variants.attributes.number:4`)).toBeTruthy()
    expect(match(`variants.attributes.number:3,4`)).toBeTruthy()
    expect(match(`variants.attributes.number:3,4,5`)).toBeTruthy()
    expect(match(`variants.attributes.number:1,2,3,5`)).toBeFalsy()
  })

  test('by attribute range', async () => {
    expect(match(`variants.attributes.number:range (0 TO 5)`)).toBeTruthy()
  })

  test('by attribute enum key', async () => {
    expect(match(`variants.attributes.Country.key:"NL"`)).toBeTruthy()
    expect(match(`variants.attributes.Country.key:"DE"`)).toBeFalsy()
  })

  test('by attribute enum key', async () => {
    expect(match(`variants.attributes.Country.key:"NL"`)).toBeTruthy()
    expect(match(`variants.attributes.Country.key:"DE"`)).toBeFalsy()
  })
})
