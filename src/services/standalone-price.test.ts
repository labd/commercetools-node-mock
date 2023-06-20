import { StandalonePriceDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'
import { CommercetoolsMock } from '../index'

const ctMock = new CommercetoolsMock()

describe('Standalone price Query', () => {
  beforeAll(async () => {
    const draft: StandalonePriceDraft = {
      value: {
        centAmount: 100,
        currencyCode: 'EUR',
      },
      country: 'DE',
      sku: 'foo',
      active: true,
      channel: {
        typeId: 'channel',
        id: 'bar',
      },
      discounted: {
        value: {
          centAmount: 80,
          currencyCode: 'EUR',
        },
        discount: {
          typeId: 'product-discount',
          id: 'baz',
        },
      },
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/standalone-prices')
      .send(draft)
    expect(createResponse.status).toEqual(201)
  })

  afterAll(async () => {
    ctMock.clear()
  })

  test('Get standalone price', async () => {
    const response = await supertest(ctMock.app).get(
      '/dummy/standalone-prices?sku=foo'
    )

    expect(response.status).toBe(200)

    expect(response.body.results).toEqual([
      {
        active: true,
        channel: {
          id: 'bar',
          typeId: 'channel',
        },
        country: 'DE',
        createdAt: expect.anything(),
        discounted: {
          discount: {
            id: 'baz',
            typeId: 'product-discount',
          },
          value: {
            centAmount: 80,
            currencyCode: 'EUR',
            fractionDigits: 2,
            type: 'centPrecision',
          },
        },
        id: expect.anything(),
        lastModifiedAt: expect.anything(),
        sku: 'foo',
        value: {
          centAmount: 100,
          currencyCode: 'EUR',
          fractionDigits: 2,
          type: 'centPrecision',
        },
        version: 1,
      },
    ])
  })
})

describe('Standalone price Actions', () => {
  let id: string | undefined
  beforeEach(async () => {
    const draft: StandalonePriceDraft = {
      value: {
        centAmount: 100,
        currencyCode: 'EUR',
      },
      country: 'DE',
      sku: 'foo',
      active: true,
      channel: {
        typeId: 'channel',
        id: 'bar',
      },
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/standalone-prices')
      .send(draft)
    expect(createResponse.status).toEqual(201)
    id = createResponse.body.id
  })

  afterEach(async () => {
    ctMock.clear()
  })

  test('changeValue', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/standalone-prices/' + id)
      .send({
        version: 1,
        actions: [
          {
            action: 'changeValue',
            value: {
              centAmount: 200,
              currencyCode: 'EUR',
            },
          },
        ],
      })

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      active: true,
      channel: {
        id: 'bar',
        typeId: 'channel',
      },
      country: 'DE',
      createdAt: expect.anything(),
      id: id,
      lastModifiedAt: expect.anything(),
      sku: 'foo',
      value: {
        centAmount: 200,
        currencyCode: 'EUR',
        fractionDigits: 2,
        type: 'centPrecision',
      },
      version: 2,
    })
  })

  test('setActive', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/standalone-prices/' + id)
      .send({
        version: 1,
        actions: [
          {
            action: 'setActive',
            active: false,
          },
        ],
      })

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      active: false,
      channel: {
        id: 'bar',
        typeId: 'channel',
      },
      country: 'DE',
      createdAt: expect.anything(),
      id: id,
      lastModifiedAt: expect.anything(),
      sku: 'foo',
      value: {
        centAmount: 100,
        currencyCode: 'EUR',
        fractionDigits: 2,
        type: 'centPrecision',
      },
      version: 2,
    })
  })

  test('setDiscounted', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/standalone-prices/' + id)
      .send({
        version: 1,
        actions: [
          {
            action: 'setDiscountedPrice',
            discounted: {
              value: {
                centAmount: 80,
                currencyCode: 'EUR',
              },
              discount: {
                typeId: 'product-discount',
                id: 'baz',
              },
            },
          },
        ],
      })

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      active: true,
      channel: {
        id: 'bar',
        typeId: 'channel',
      },
      country: 'DE',
      createdAt: expect.anything(),
      discounted: {
        discount: {
          id: 'baz',
          typeId: 'product-discount',
        },
        value: {
          centAmount: 80,
          currencyCode: 'EUR',
          fractionDigits: 2,
          type: 'centPrecision',
        },
      },
      id: id,
      lastModifiedAt: expect.anything(),
      sku: 'foo',
      value: {
        centAmount: 100,
        currencyCode: 'EUR',
        fractionDigits: 2,
        type: 'centPrecision',
      },
      version: 2,
    })

    const response2 = await supertest(ctMock.app)
      .post('/dummy/standalone-prices/' + id)
      .send({
        version: 2,
        actions: [
          {
            action: 'setDiscountedPrice',
            discounted: null,
          },
        ],
      })

    expect(response2.status).toBe(200)

    expect(response2.body).toEqual({
      active: true,
      channel: {
        id: 'bar',
        typeId: 'channel',
      },
      country: 'DE',
      createdAt: expect.anything(),
      id: id,
      lastModifiedAt: expect.anything(),
      sku: 'foo',
      value: {
        centAmount: 100,
        currencyCode: 'EUR',
        fractionDigits: 2,
        type: 'centPrecision',
      },
      version: 3,
    })
  })
})
