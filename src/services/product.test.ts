import {
  InventoryEntry,
  Product,
  ProductDraft,
  Type,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'
import assert from 'assert'

const ctMock = new CommercetoolsMock()

describe('Product', () => {
  test('Create product', async () => {
    const draft: ProductDraft = {
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
      .post('/dummy/products')
      .send(draft)

    expect(response.body).toEqual({
      createdAt: expect.anything(),
      id: expect.anything(),
      lastModifiedAt: expect.anything(),
      masterData: {
        staged: {
          name: {
            'nl-NL': 'test product',
          },
          slug: {
            'nl-NL': 'test-product',
          },
          categories: [],
          masterVariant: expect.anything(),
          variants: [],
        },
        hasStagedChanges: true,
        published: false,
      },
      version: 1,
    })
  })
})

describe('Product update actions', () => {
  const ctMock = new CommercetoolsMock()
  let product: Product | undefined

  beforeEach(async () => {
    const draft: ProductDraft = {
      name: {
        'nl-NL': 'test product',
      },
      productType: {
        typeId: 'product-type',
        id: 'some-uuid',
      },
      masterVariant: {
        sku: '1337',
        attributes: [
          {
            name: 'test',
            value: 'test',
          },
        ],
      },
      slug: {
        'nl-NL': 'test-product',
      },
      publish: true,
    }
    let response = await supertest(ctMock.app)
      .post('/dummy/products')
      .send(draft)

    expect(response.status).toBe(200)
    product = response.body
  })

  test('setAttribute', async () => {
    assert(product)

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${product.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'setAttribute', sku: '1337', name: 'foo', value: 'bar' },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(
      response.body.masterData.current.masterVariant.attributes
    ).toHaveLength(2)
    const attr = response.body.masterData.current.masterVariant.attributes[1]
    expect(attr).toEqual({ name: 'foo', value: 'bar' })
  })

  test('setAttribute overwrite', async () => {
    assert(product)

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${product.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'setAttribute', sku: '1337', name: 'test', value: 'foo' },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(
      response.body.masterData.current.masterVariant.attributes
    ).toHaveLength(1)
    const attr = response.body.masterData.current.masterVariant.attributes[0]
    expect(attr).toEqual({ name: 'test', value: 'foo' })
  })
})
