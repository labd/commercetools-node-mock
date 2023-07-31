import type { MyPaymentDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index.js'

const ctMock = new CommercetoolsMock()

describe('MyPayment', () => {
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

  test('Create payment', async () => {
    const draft: MyPaymentDraft = {
      amountPlanned: { currencyCode: 'EUR', centAmount: 1337 },
      custom: {
        type: { typeId: 'type', key: 'custom-payment' },
        fields: {
          foo: 'bar',
        },
      },
    }
    const response = await supertest(ctMock.app)
      .post('/dummy/me/payments')
      .send(draft)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.anything(),
      createdAt: expect.anything(),
      lastModifiedAt: expect.anything(),
      version: 1,
      amountPlanned: {
        type: 'centPrecision',
        fractionDigits: 2,
        currencyCode: 'EUR',
        centAmount: 1337,
      },
      paymentStatus: {},
      transactions: [],
      interfaceInteractions: [],
      custom: {
        type: { typeId: 'type', id: expect.anything() },
        fields: { foo: 'bar' },
      },
    })
  })
  test('Get payment', async () => {
    const draft: MyPaymentDraft = {
      amountPlanned: { currencyCode: 'EUR', centAmount: 1337 },
      custom: {
        type: { typeId: 'type', key: 'custom-payment' },
        fields: {
          foo: 'bar',
        },
      },
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/me/payments')
      .send(draft)

    const response = await supertest(ctMock.app).get(
      `/dummy/me/payments/${createResponse.body.id}`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual(createResponse.body)
  })
})
