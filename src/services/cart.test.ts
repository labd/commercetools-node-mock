import { Address, Cart } from '@commercetools/platform-sdk'
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

  beforeEach(async () => {
    let response = await supertest(ctMock.app).post('/dummy/carts').send({
      currency: 'EUR',
    })
    expect(response.status).toBe(201)
    cart = response.body
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
