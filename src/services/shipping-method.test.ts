import {
  ShippingMethodDraft,
  TaxCategoryDraft,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'

const ctMock = new CommercetoolsMock()

describe('Shipping method', () => {
  beforeEach(async () => {
    const draft: TaxCategoryDraft = {
      name: 'foo',
      key: 'standard',
      rates: [],
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/tax-categories')
      .send(draft)
    expect(createResponse.status).toEqual(200)
  })

  afterEach(async () => {
    ctMock.clear()
  })

  test('Create shipping method', async () => {
    const draft: ShippingMethodDraft = {
      name: 'foo',
      taxCategory: { typeId: 'tax-category', key: 'standard' },
      isDefault: true,
      zoneRates: [],
    }
    const response = await supertest(ctMock.app)
      .post('/dummy/shipping-methods')
      .send(draft)

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      createdAt: expect.anything(),
      id: expect.anything(),
      isDefault: true,
      lastModifiedAt: expect.anything(),
      name: 'foo',
      taxCategory: {
        id: expect.anything(),
        typeId: 'tax-category',
      },
      version: 1,
      zoneRates: [],
    })
  })

  test('Get shipping method', async () => {
    const draft: ShippingMethodDraft = {
      name: 'foo',
      taxCategory: { typeId: 'tax-category', key: 'standard' },
      isDefault: true,
      zoneRates: [],
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/shipping-methods')
      .send(draft)

    expect(createResponse.status).toBe(200)

    const response = await supertest(ctMock.app).get(
      `/dummy/shipping-methods/${createResponse.body.id}`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual(createResponse.body)
  })

  test('Get shipping methods mmatching cart', async () => {
    const draft: ShippingMethodDraft = {
      name: 'foo',
      taxCategory: { typeId: 'tax-category', key: 'standard' },
      isDefault: true,
      zoneRates: [],
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/shipping-methods')
      .send(draft)

    expect(createResponse.status).toBe(200)

    const response = await supertest(ctMock.app).get(
      `/dummy/shipping-methods/matching-cart`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ results: [createResponse.body] })
  })
})
