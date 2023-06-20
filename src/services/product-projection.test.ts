import {
  Product,
  ProductDraft,
  ProductProjection,
  ProductProjectionPagedSearchResponse,
  ProductType,
  ProductTypeDraft,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import * as timekeeper from 'timekeeper'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index'
import { Writable } from '../types'

const ctMock = new CommercetoolsMock()

let productType: ProductType
let productProjection: ProductProjection
let publishedProduct: Product
let unpublishedProduct: Product

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

  // Create an unpublished product
  {
    const productDraft: Writable<ProductDraft> = {
      publish: false,
      key: 'my-unpublished-product',
      masterVariant: {
        sku: 'my-unpub-sku',
        prices: [
          {
            value: {
              currencyCode: 'EUR',
              centAmount: 189,
            },
          },
        ],
        attributes: [
          {
            name: 'number',
            value: 1 as any,
          },
        ],
      },
      name: {
        'nl-NL': 'test unpublished product',
      },
      productType: {
        typeId: 'product-type',
        id: productType.id,
      },
      slug: {
        'nl-NL': 'test-unpublished-product',
      },
    }

    const response = await supertest(ctMock.app)
      .post('/dummy/products')
      .send(productDraft)
    expect(response.ok).toBe(true)
    unpublishedProduct = response.body
  }

  // Create a published product
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
            value: 4 as any,
          },
        ],
      },
      variants: [
        {
          sku: 'my-other-sku',
          prices: [
            {
              value: {
                currencyCode: 'EUR',
                centAmount: 91789,
              },
            },
          ],
          attributes: [
            {
              name: 'number',
              value: 50 as any,
            },
          ],
        },
      ],
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
    publishedProduct = response.body

    // Create the expected ProductProjection object
    productProjection = {
      id: product.id,
      createdAt: '2022-07-22T13:31:49.840Z',
      lastModifiedAt: '2022-07-22T13:31:49.840Z',
      version: 1,
      key: 'my-product-key',
      published: true,
      hasStagedChanges: false,
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
      variants: [
        {
          id: 2,
          sku: 'my-other-sku',
          prices: [
            {
              id: product.masterData.current.variants[0].prices[0].id,
              value: {
                type: 'centPrecision',
                currencyCode: 'EUR',
                centAmount: 91789,
                fractionDigits: 2,
              },
            },
          ],
          assets: [],
          images: [],
          attributes: productDraft.variants![0].attributes,
        },
      ],
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
  ctMock.clear()
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

  test('Search - unpublished', async () => {
    {
      const response = await supertest(ctMock.app)
        .get('/dummy/product-projections/search')
        .query({
          limit: 50,
          staged: true,
        })

      const result: ProductProjectionPagedSearchResponse = response.body

      expect(result).toMatchObject({
        count: 2,
        limit: 50,
        offset: 0,
        total: 2,
        facets: {},
        results: [
          { id: unpublishedProduct.id, published: false },
          { id: publishedProduct.id, published: true },
        ],
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
        filter: ['variants.attributes.number:range(5 TO 10)'],
      })

    const result: ProductProjectionPagedSearchResponse = response.body
    expect(result).toMatchObject({
      count: 0,
      results: [],
    })
  })
})

describe('Product Projection Search - Facets', () => {
  test('termExpr - variants.attributes.number', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/product-projections/search')
      .query({
        facet: ['variants.attributes.number'],
      })

    const result: ProductProjectionPagedSearchResponse = response.body
    expect(result).toMatchObject({
      count: 1,
      facets: {
        'variants.attributes.number': {
          type: 'terms',
          dataType: 'text',
          missing: 0,
          total: 2,
          terms: [
            {
              term: '4.0',
              count: 1,
            },
            {
              term: '50.0',
              count: 1,
            },
          ],
        },
      },
      results: [
        {
          masterVariant: { sku: 'my-sku' },
        },
      ],
    })
  })

  test('filterExpr - variants.attributes.number', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/product-projections/search')
      .query({
        facet: ['variants.attributes.number:3,4'],
      })

    const result: ProductProjectionPagedSearchResponse = response.body
    expect(result).toMatchObject({
      count: 1,
      facets: {
        'variants.attributes.number': {
          type: 'filter',
          count: 1,
        },
      },
      results: [
        {
          masterVariant: { sku: 'my-sku' },
        },
      ],
    })
  })

  test('rangeExpr - variants.attributes.number', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/product-projections/search')
      .query({
        facet: [
          'variants.attributes.number:range(* TO 5), (5 TO 25), (25 TO 100)',
        ],
      })

    const result: ProductProjectionPagedSearchResponse = response.body
    expect(result).toMatchObject({
      count: 1,
      facets: {
        'variants.attributes.number': {
          type: 'range',
          dataType: 'number',
          ranges: [
            {
              type: 'double',
              from: 0.0,
              fromStr: '',
              to: 5.0,
              toStr: '5.0',
              count: 1,
              // totalCount: 1,
              total: 4.0,
              min: 4.0,
              max: 4.0,
              mean: 4.0,
            },
            {
              type: 'double',
              from: 5.0,
              fromStr: '5.0',
              to: 25.0,
              toStr: '25.0',
              count: 0,
              // totalCount: 0,
              total: 0.0,
              min: 0.0,
              max: 0.0,
              mean: 0.0,
            },
            {
              type: 'double',
              from: 25.0,
              fromStr: '25.0',
              to: 100.0,
              toStr: '100.0',
              count: 1,
              // totalCount: 1,
              total: 50,
              min: 50.0,
              max: 50.0,
              mean: 50.0,
            },
          ],
        },
      },
      results: [
        {
          masterVariant: { sku: 'my-sku' },
        },
      ],
    })
  })
})
