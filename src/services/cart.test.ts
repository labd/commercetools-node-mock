import {
  Address,
  Cart,
  CentPrecisionMoney,
  ProductDraft,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'
import assert from 'assert'

describe('Carts Query', () => {
  const ctMock = new CommercetoolsMock()

  beforeEach(async () => {
    let response
    response = await supertest(ctMock.app)
      .post('/dummy/types')
      .send({
        key: 'my-cart',
        name: {
          en: 'Test',
        },
        description: {
          en: 'Test Type',
        },
        resourceTypeIds: ['order'],
        fieldDefinitions: [
          {
            name: 'offer_name',
            label: {
              en: 'offer_name',
            },
            required: false,
            type: {
              name: 'String',
            },
            inputHint: 'SingleLine',
          },
        ],
      })
    expect(response.status).toBe(201)

    response = await supertest(ctMock.app)
      .post('/dummy/carts')
      .send({
        currency: 'EUR',
        custom: {
          type: {
            typeId: 'type',
            key: 'my-cart',
          },
          fields: {
            description: 'example description',
          },
        },
      })
    expect(response.status).toBe(201)
  })

  test('no filter', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/carts')
      .query({
        expand: 'custom.type',
      })
      .send()

    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)

    const myCart = response.body.results[0] as Cart

    expect(myCart.custom?.type.id).not.toBeUndefined()
    expect(myCart.custom?.type.id).toBe(myCart.custom?.type.obj?.id)
    expect(myCart.custom?.type.obj?.description?.en).toBe('Test Type')
  })
})

describe('Order Update Actions', () => {
  const ctMock = new CommercetoolsMock()
  let cart: Cart | undefined
  const productDraft: ProductDraft = {
    name: {
      'nl-NL': 'test product',
    },
    productType: {
      typeId: 'product-type',
      id: 'some-uuid',
    },
    masterVariant: {
      sku: '1337',
      prices: [
        {
          value: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 14900,
            fractionDigits: 2,
          } as CentPrecisionMoney,
        },
      ],

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
        prices: [
          {
            value: {
              type: 'centPrecision',
              currencyCode: 'EUR',
              centAmount: 14900,
              fractionDigits: 2,
            } as CentPrecisionMoney,
          },
        ],
        attributes: [
          {
            name: 'test2',
            value: 'test2',
          },
        ],
      },
    ],
    slug: {
      'nl-NL': 'test-product',
    },
    publish: true,
  }

  beforeEach(async () => {
    let response = await supertest(ctMock.app).post('/dummy/carts').send({
      currency: 'EUR',
    })
    expect(response.status).toBe(201)
    cart = response.body
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('no update', async () => {
    assert(cart, 'cart not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setLocale', locale: 'nl-NL' }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.locale).toBe('nl-NL')

    const responseAgain = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 2,
        actions: [{ action: 'setLocale', locale: 'nl-NL' }],
      })
    expect(responseAgain.status).toBe(200)
    expect(responseAgain.body.version).toBe(2)
    expect(responseAgain.body.locale).toBe('nl-NL')
  })

  test('addLineItem', async () => {
    const product = await supertest(ctMock.app)
      .post(`/dummy/products`)
      .send(productDraft)
      .then((x) => x.body)

    assert(cart, 'cart not created')
    assert(product, 'product not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'addLineItem',
            productId: product.id,
            variantId: product.masterData.current.variants[0].id,
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.lineItems).toHaveLength(1)
    expect(response.body.totalPrice.centAmount).toEqual(14900)
  })

  test('addLineItem by SKU', async () => {
    const product = await supertest(ctMock.app)
      .post(`/dummy/products`)
      .send(productDraft)
      .then((x) => x.body)

    assert(cart, 'cart not created')
    assert(product, 'product not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [{ action: 'addLineItem', sku: '1337', quantity: 2 }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.lineItems).toHaveLength(1)
    expect(response.body.totalPrice.centAmount).toEqual(29800)
  })

  test('addLineItem unknown product', async () => {
    assert(cart, 'cart not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [{ action: 'addLineItem', productId: '123', variantId: 1 }],
      })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("A product with ID '123' not found.")
  })

  test('setBillingAddress', async () => {
    assert(cart, 'cart not created')

    const address: Address = {
      streetName: 'Street name',
      city: 'Utrecht',
      country: 'NL',
    }

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setBillingAddress', address }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.billingAddress).toEqual(address)
  })

  test('setCountry', async () => {
    assert(cart, 'cart not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setCountry', country: 'NL' }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.country).toBe('NL')
  })

  test('setCustomerEmail', async () => {
    assert(cart, 'cart not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setCustomerEmail', email: 'john@doe.com' }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.customerEmail).toBe('john@doe.com')
  })

  test('setShippingAddress', async () => {
    assert(cart, 'cart not created')

    const address: Address = {
      streetName: 'Street name',
      city: 'Utrecht',
      country: 'NL',
    }

    const response = await supertest(ctMock.app)
      .post(`/dummy/carts/${cart.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setShippingAddress', address }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.shippingAddress).toEqual(address)
  })
})
