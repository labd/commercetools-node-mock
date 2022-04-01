import { ProductDraft, ProductProjection } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'
import * as qs from 'querystring'

const ctMock = new CommercetoolsMock()

describe('Product Projection', () => {
  afterEach(() => {
    ctMock.clear()
  })

  test('Create product projection', async () => {
    const draft: ProductDraft = {
      key: '1337357',
      masterVariant: {
        sku: '1337',
      },
      name: {
        'nl-NL': 'test product',
      },
      productType: {
        typeId: 'product-type',
        id: 'some-uuid',
      },
      slug: {
        'nl-NL': 'test-product',
      },
    }
    const response = await supertest(ctMock.app)
      .post('/dummy/product-projections')
      .send(draft)

    const projection: ProductProjection = response.body
    expect(projection).toEqual({
      createdAt: expect.anything(),
      id: expect.anything(),
      lastModifiedAt: expect.anything(),
      name: {
        'nl-NL': 'test product',
      },
      slug: {
        'nl-NL': 'test-product',
      },
      categories: [],
      version: 1,
      masterVariant: {
        id: 0,
        sku: '1337',
      },
      productType: {
        id: 'some-uuid',
        typeId: 'product-type',
      },
      variants: [],
    })
  })

  test('Get product projection by 404 when not found by key with expand', async () => {
    const response = await supertest(ctMock.app).get(
      '/dummy/product-projections/key=DOESNOTEXIST?' +
        qs.stringify({
          expand: ['categories[*]'],
        })
    )

    expect(response.status).toBe(404)
  })

  test('Search product projection', async () => {
    ctMock.project('dummy').add('product-projection', {
      id: '',
      version: 1,
      productType: {
        id: 'fake',
        typeId: 'product-type',
      },
      name: { 'nl-NL': 'test-prod' },
      slug: {},
      variants: [],
      masterVariant: { id: 1, sku: '1337' },
      createdAt: '',
      lastModifiedAt: '',
      categories: [],
    })

    const response = await supertest(ctMock.app).get(
      '/dummy/product-projections/search?' +
        qs.stringify({
          filter: ['masterVariant.sku:"1337"'],
        })
    )

    const projection: ProductProjection = response.body
    expect(projection).toEqual({
      count: 1,
      limit: 20,
      offset: 0,
      total: 1,
      results: [
        {
          categories: [],
          createdAt: '',
          id: '',
          lastModifiedAt: '',
          masterVariant: { id: 1, sku: '1337' },
          name: { 'nl-NL': 'test-prod' },
          productType: { id: 'fake', typeId: 'product-type' },
          slug: {},
          variants: [],
          version: 1,
        },
      ],
    })
  })
})
