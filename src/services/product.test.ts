import {
  Image,
  PriceDraft,
  Product,
  ProductData,
  ProductDraft,
} from '@commercetools/platform-sdk'
import assert from 'assert'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'

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
    prices: [
      {
        country: 'NL',
        value: {
          currencyCode: 'EUR',
          centAmount: 1000,
        },
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
      prices: [
        {
          country: 'NL',
          value: {
            currencyCode: 'EUR',
            centAmount: 2000,
          },
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

    const productData: ProductData = {
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
      searchKeywords: {},
    }

    expect(response.body).toEqual({
      createdAt: expect.anything(),
      id: expect.anything(),
      lastModifiedAt: expect.anything(),
      masterData: {
        staged: productData,
        current: productData,
        hasStagedChanges: false,
        published: false,
      },
      productType: {
        typeId: 'product-type',
        id: 'some-uuid',
      },
      version: 1,
    } as Product)
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
    expect(response.body.masterData.staged.variants[0].attributes).toHaveLength(
      2
    )
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

  test('addExternalImage variant', async () => {
    assert(productPublished, 'product not created')

    const image: Image = {
      url: 'http://example.com/image',
      dimensions: { w: 100, h: 100 },
    }
    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [{ action: 'addExternalImage', sku: '1338', image }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.masterData.staged.variants[0].images).toHaveLength(1)
    const attr = response.body.masterData.staged.variants[0].images[0]
    expect(attr).toEqual(image)
  })

  test('removeImage variant', async () => {
    assert(productPublished, 'product not created')

    const image: Image = {
      url: 'http://example.com/image',
      dimensions: { w: 100, h: 100 },
    }

    {
      const response = await supertest(ctMock.app)
        .post(`/dummy/products/${productPublished.id}`)
        .send({
          version: 1,
          actions: [{ action: 'addExternalImage', sku: '1338', image }],
        })
      expect(response.status).toBe(200)
      expect(response.body.version).toBe(2)
    }

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 2,
        actions: [
          {
            action: 'removeImage',
            sku: '1338',
            imageUrl: image.url,
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(3)
    expect(response.body.masterData.staged.variants[0].images).toHaveLength(0)
  })

  test('moveImageToPosition variant', async () => {
    assert(productPublished, 'product not created')

    const image1: Image = {
      url: 'http://example.com/image1',
      dimensions: { w: 100, h: 100 },
    }
    const image2: Image = {
      url: 'http://example.com/image2',
      dimensions: { w: 100, h: 100 },
    }

    {
      const response = await supertest(ctMock.app)
        .post(`/dummy/products/${productPublished.id}`)
        .send({
          version: 1,
          actions: [
            { action: 'addExternalImage', sku: '1338', image: image1 },
            { action: 'addExternalImage', sku: '1338', image: image2 },
          ],
        })
      expect(response.status).toBe(200)
      expect(response.body.version).toBe(3)
    }

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 3,
        actions: [
          {
            action: 'moveImageToPosition',
            sku: '1338',
            imageUrl: image2.url,
            position: 0,
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(4)
    expect(response.body.masterData.staged.variants[0].images).toEqual([
      { url: 'http://example.com/image2', dimensions: { w: 100, h: 100 } },
      { url: 'http://example.com/image1', dimensions: { w: 100, h: 100 } },
    ])
  })

  test('addPrice variant', async () => {
    assert(productPublished, 'product not created')

    const priceDraft: PriceDraft = {
      country: 'BE',
      value: {
        currencyCode: 'EUR',
        centAmount: 3000,
      },
    }

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'addPrice',
            price: priceDraft,
            variantId: 1,
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.masterData.staged.masterVariant.prices).toMatchObject([
      {
        country: 'NL',
        value: {
          currencyCode: 'EUR',
          centAmount: 1000,
        },
      },
      {
        country: 'BE',
        value: {
          currencyCode: 'EUR',
          centAmount: 3000,
        },
      },
    ])
  })

  test('changePrice variant', async () => {
    assert(productPublished, 'product not created')
    const priceId =
      productPublished?.masterData.current.masterVariant.prices?.[0].id
    assert(priceId)

    const priceDraft: PriceDraft = {
      country: 'BE',
      value: {
        currencyCode: 'EUR',
        centAmount: 3000,
      },
    }

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'changePrice',
            priceId,
            price: priceDraft,
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.masterData.staged.masterVariant.prices).toMatchObject([
      {
        id: priceId,
        country: 'BE',
        value: {
          currencyCode: 'EUR',
          centAmount: 3000,
        },
      },
    ])
  })

  test('removePrice variant', async () => {
    assert(productPublished, 'product not created')
    const priceId =
      productPublished?.masterData.current.masterVariant.prices?.[0].id
    assert(priceId)

    const response = await supertest(ctMock.app)
      .post(`/dummy/products/${productPublished.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'removePrice',
            priceId,
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.masterData.staged.masterVariant.prices).toHaveLength(0)
  })
})
