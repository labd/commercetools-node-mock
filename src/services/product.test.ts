import { Product, ProductDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'
import assert from 'assert'

const ctMock = new CommercetoolsMock()

const publishedProductDraft: ProductDraft = {
  name: {
    'nl-NL': 'test published product',
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
  variants: [
    {
      sku: '1338',
      attributes: [
        {
          name: 'test2',
          value: 'test2',
        },
      ],
    },
  ],
  slug: {
    'nl-NL': 'test-published-product',
  },
  publish: true,
}

const unpublishedProductDraft: ProductDraft = {
  name: {
    'nl-NL': 'test unpublished product',
  },
  productType: {
    typeId: 'product-type',
    id: 'some-uuid',
  },
  masterVariant: {
    sku: '2337',
    attributes: [
      {
        name: 'test',
        value: 'test',
      },
    ],
  },
  variants: [
    {
      sku: '2338',
      attributes: [
        {
          name: 'test2',
          value: 'test2',
        },
      ],
    },
  ],
  slug: {
    'nl-NL': 'test-unpublished-product',
  },
  publish: false,
}

describe('Product', () => {
  test('Create product', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/products')
      .send(unpublishedProductDraft)

    expect(response.body).toEqual({
      createdAt: expect.anything(),
      id: expect.anything(),
      lastModifiedAt: expect.anything(),
      masterData: {
        staged: {
          name: {
            'nl-NL': 'test unpublished product',
          },
          slug: {
            'nl-NL': 'test-unpublished-product',
          },
          categories: [],
          masterVariant: {
            sku: '2337',
            assets: [],
            attributes: [
              {
                name: 'test',
                value: 'test',
              },
            ],
            id: 1,
            images: [],
          },
          variants: [
            {
              sku: '2338',
              assets: [],
              id: 2,
              images: [],
              attributes: [
                {
                  name: 'test2',
                  value: 'test2',
                },
              ],
            },
          ],
        },
        hasStagedChanges: false,
        published: false,
      },
      productType: {
        typeId: 'product-type',
        id: 'some-uuid',
      },
      version: 1,
    })
  })
})

describe('Product update actions', () => {
  const ctMock = new CommercetoolsMock()
  let productPublished: Product | undefined
  let productUnpublished: Product | undefined

  beforeEach(async () => {
    let response
    response = await supertest(ctMock.app)
      .post('/dummy/products')
      .send(publishedProductDraft)

    expect(response.status).toBe(201)
    productPublished = response.body

    response = await supertest(ctMock.app)
      .post('/dummy/products')
      .send(unpublishedProductDraft)

    expect(response.status).toBe(201)
    productUnpublished = response.body
  })

  test('setAttribute masterVariant (staged)', async () => {
    assert(productPublished, 'product not created')

    {
      const response = await supertest(ctMock.app)
        .post(`/dummy/products/${productPublished.id}`)
        .send({
          version: 1,
          actions: [
            { action: 'setAttribute', sku: '1337', name: 'foo', value: 'bar' },
          ],
        })

      expect(response.status).toBe(200)
      const product: Product = response.body
      expect(product.version).toBe(2)
      expect(product.masterData.hasStagedChanges).toBeTruthy()
      expect(product.masterData.current.masterVariant.attributes).toHaveLength(
        1
      )
      expect(product.masterData.staged.masterVariant.attributes).toHaveLength(2)

      const attr = response.body.masterData.staged.masterVariant.attributes[1]
      expect(attr).toEqual({ name: 'foo', value: 'bar' })
    }

    // Publish
    {
      const response = await supertest(ctMock.app)
        .post(`/dummy/products/${productPublished.id}`)
        .send({
          version: 2,
          actions: [{ action: 'publish', scope: 'All' }],
        })

      expect(response.status).toBe(200)
      const product: Product = response.body
      expect(product.version).toBe(3)
      expect(product.masterData.hasStagedChanges).toBeFalsy()
      expect(product.masterData.current.masterVariant.attributes).toHaveLength(
        2
      )
    }
  })

  test('setAttribute masterVariant (published)', async () => {
    assert(productPublished, 'product not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'setAttribute',
            sku: '1337',
            name: 'foo',
            value: 'bar',
            staged: false,
          },
        ],
      })

    expect(response.status).toBe(200)
    const product: Product = response.body

    // TODO: Since we auto publish it actually does two version updates. So the
    // version should be 3
    expect(product.version).toBe(2)
    expect(product.masterData.hasStagedChanges).toBeFalsy()
    expect(product.masterData.current.masterVariant.attributes).toHaveLength(2)
    expect(product.masterData.staged.masterVariant.attributes).toHaveLength(2)

    const attr = response.body.masterData.staged.masterVariant.attributes[1]
    expect(attr).toEqual({ name: 'foo', value: 'bar' })
  })

  test('setAttribute variant', async () => {
    assert(productPublished, 'product not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'setAttribute', sku: '1338', name: 'foo', value: 'bar' },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(
      response.body.masterData.staged.variants[0].attributes
    ).toHaveLength(2)
    const attr = response.body.masterData.staged.variants[0].attributes[1]
    expect(attr).toEqual({ name: 'foo', value: 'bar' })
  })

  test('setAttribute variant and publish', async () => {
    assert(productPublished, 'product not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'setAttribute', sku: '1338', name: 'foo', value: 'bar' },
          { action: 'publish' },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(3)
    expect(
      response.body.masterData.current.variants[0].attributes
    ).toHaveLength(2)
    const attr = response.body.masterData.current.variants[0].attributes[1]
    expect(attr).toEqual({ name: 'foo', value: 'bar' })
  })

  test('setAttribute overwrite', async () => {
    assert(productPublished, 'product not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'setAttribute', sku: '1337', name: 'test', value: 'foo' },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(
      response.body.masterData.staged.masterVariant.attributes
    ).toHaveLength(1)
    const attr = response.body.masterData.staged.masterVariant.attributes[0]
    expect(attr).toEqual({ name: 'test', value: 'foo' })
  })
})
