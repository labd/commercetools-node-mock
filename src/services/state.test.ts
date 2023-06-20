import { StateDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index'

const ctMock = new CommercetoolsMock()

describe('State', () => {
  test('Create state', async () => {
    const draft: StateDraft = {
      key: 'foo',
      type: 'PaymentState',
    }
    const response = await supertest(ctMock.app)
      .post('/dummy/states')
      .send(draft)

    expect(response.status).toBe(201)

    expect(response.body).toEqual({
      builtIn: false,
      createdAt: expect.anything(),
      id: expect.anything(),
      initial: false,
      key: 'foo',
      lastModifiedAt: expect.anything(),
      transitions: [],
      type: 'PaymentState',
      version: 1,
    })
  })

  test('Get state', async () => {
    const draft: StateDraft = {
      key: 'foo',
      type: 'PaymentState',
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/states')
      .send(draft)

    expect(createResponse.status).toBe(201)

    const response = await supertest(ctMock.app).get(
      `/dummy/states/${createResponse.body.id}`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual(createResponse.body)
  })
})
