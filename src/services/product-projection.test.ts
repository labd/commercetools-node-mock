import {
  ProductDraft,
  ProductProjection,
  ProductProjectionPagedSearchResponse,
  ProductType,
  ProductTypeDraft,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import * as timekeeper from 'timekeeper'
import { CommercetoolsMock } from '../index'
import { Writable } from 'types'

const ctMock = new CommercetoolsMock()

let productType: ProductType
let productProjection: ProductProjection

beforeEach(async () => {
  timekeeper.freeze(new Date('2022-07-22T13:31:49.840Z'))

  // Create the product type
  {
    const draft: ProductTypeDraft = {
      name: 'Default Product Type',
      description: 'Product type for testing',
    }
    const response = await supertest(ctMock.app)
      .post('/dummy/product-types')
      .send(draft)

    expect(response.ok).toBe(true)
    productType = response.body
  }

  // Create the product
  {
    const productDraft: Writable<ProductDraft> = {
      publish: true,
      key: 'my-product-key',
      masterVariant: {
        sku: 'my-sku',
        prices: [
          {
            value: {
              currencyCode: 'EUR',
              centAmount: 1789,
            },
          },
        ],
        attributes: [
          {
            name: 'number',
            value: '1' as any,
          },
        ],
      },
      name: {
        'nl-NL': 'test product',
      },
      productType: {
        typeId: 'product-type',
        id: productType.id,
      },
      slug: {
        'nl-NL': 'test-product',
      },
    }

    const response = await supertest(ctMock.app)
      .post('/dummy/products')
      .send(productDraft)
    expect(response.ok).toBe(true)
    const product = response.body

    // Create the expected ProductProjection object
    productProjection = {
      id: product.id,
      createdAt: '2022-07-22T13:31:49.840Z',
      lastModifiedAt: '2022-07-22T13:31:49.840Z',
      version: 1,
      masterVariant: {
        id: 1,
        sku: 'my-sku',
        prices: [
          {
            id: product.masterData.current.masterVariant.prices[0].id,
            value: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 1789,
              fractionDigits: 2,
            },
          },
        ],
        assets: [],
        images: [],
        attributes: productDraft.masterVariant?.attributes,
      },
      variants: [],
      name: productDraft.name,
      slug: productDraft.slug,
      categories: [],
      productType: {
        typeId: 'product-type',
        id: productType.id,
      },
    }
  }
})

afterEach(async () => {
  timekeeper.reset()

  const response = await supertest(ctMock.app)
    .delete(`/dummy/products/${productProjection.id}`)
    .send()
  expect(response.ok).toBe(true)
  const product = response.body
})

// Test the general product projection implementation
describe('Product Projection Search - Generic', () => {
  test('Pagination', async () => {
    {
      const response = await supertest(ctMock.app)
        .get('/dummy/product-projections/search')
        .query({
          limit: 50,
        })

      const result: ProductProjectionPagedSearchResponse = response.body
      expect(result).toEqual({
        count: 1,
        limit: 50,
        offset: 0,
        total: 1,
        facets: {},
        results: [productProjection],
      })
    }
    {
      const response = await supertest(ctMock.app)
        .get('/dummy/product-projections/search')
        .query({
          limit: 50,
          offset: 50,
        })

      const projection: ProductProjection = response.body
      expect(projection).toEqual({
        count: 1,
        limit: 50,
        offset: 50,
        total: 0,
        facets: {},
        results: [],
      })
    }
  })

  test('Get 404 when not found by key with expand', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/product-projections/key=DOESNOTEXIST')
      .query({
        expand: ['categories[*]'],
      })

    expect(response.status).toBe(404)
  })
})

describe('Product Projection Search - Filters', () => {
  test('variants.sku', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/product-projections/search')
      .query({
        filter: ['variants.sku:"my-sku"'],
      })

    const result: ProductProjectionPagedSearchResponse = response.body
    expect(result).toMatchObject({
      count: 1,
      results: [
        {
          masterVariant: { sku: 'my-sku' },
        },
      ],
    })
  })

  test('variants.attributes.range - match', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/product-projections/search')
      .query({
        filter: ['variants.attributes.number:range(0 TO 10)'],
      })

    const result: ProductProjectionPagedSearchResponse = response.body
    expect(result).toMatchObject({
      count: 1,
      results: [
        {
          masterVariant: { sku: 'my-sku' },
        },
      ],
    })
  })

  test('variants.attributes.range - mismatch', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/product-projections/search')
      .query({
        filter: ['variants.attributes.number:range(2 TO 10)'],
      })

    const result: ProductProjectionPagedSearchResponse = response.body
    expect(result).toMatchObject({
      count: 0,
      results: [],
    })
  })
})
