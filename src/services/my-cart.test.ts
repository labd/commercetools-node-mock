import { MyCartDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index'

const ctMock = new CommercetoolsMock()

describe('MyCart', () => {
  beforeEach(async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/types')
      .send({
        key: 'custom-payment',
        name: {
          'nl-NL': 'custom-payment',
        },
        resourceTypeIds: ['payment'],
      })
    expect(response.status).toBe(201)
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('Create my cart', async () => {
    const draft: MyCartDraft = {
      currency: 'EUR',
    }

    const response = await supertest(ctMock.app)
      .post('/dummy/me/carts')
      .send(draft)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.anything(),
      createdAt: expect.anything(),
      lastModifiedAt: expect.anything(),
      version: 1,
      cartState: 'Active',
      lineItems: [],
      customLineItems: [],
      shipping: [],
      shippingMode: 'Single',
      totalPrice: {
        type: 'centPrecision',
        centAmount: 0,
        currencyCode: 'EUR',
        fractionDigits: 0,
      },
      taxMode: 'Platform',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',

      refusedGifts: [],
      origin: 'Customer',
    })
  })

  test('Get my cart by ID', async () => {
    const draft: MyCartDraft = {
      currency: 'EUR',
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/me/carts')
      .send(draft)

    const response = await supertest(ctMock.app).get(
      `/dummy/me/carts/${createResponse.body.id}`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual(createResponse.body)
  })

  test('Get my active cart', async () => {
    const draft: MyCartDraft = {
      currency: 'EUR',
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/me/carts')
      .send(draft)

    const response = await supertest(ctMock.app).get(`/dummy/me/active-cart`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual(createResponse.body)
  })

  test('Get my active cart which doesnt exists', async () => {
    const response = await supertest(ctMock.app).get(`/dummy/me/active-cart`)

    expect(response.status).toBe(404)
  })
})
