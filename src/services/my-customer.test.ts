import type { MyCustomerDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { afterEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index.js'

const ctMock = new CommercetoolsMock()

describe('Me', () => {
  afterEach(() => {
    ctMock.clear()
  })

  test('Create me', async () => {
    const draft: MyCustomerDraft = {
      email: 'test@example.org',
      password: 'p4ssw0rd',
    }

    const response = await supertest(ctMock.app)
      .post('/dummy/me/signup')
      .send(draft)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      customer: {
        ...draft,
        password: 'cDRzc3cwcmQ=',
        authenticationMode: 'Password',
        version: 1,
        isEmailVerified: false,
        addresses: [],
        id: expect.anything(),
        createdAt: expect.anything(),
        lastModifiedAt: expect.anything(),
      }
    })
  })

  test('Get me', async () => {
    const draft: MyCustomerDraft = {
      email: 'test@example.org',
      password: 'p4ssw0rd',
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/me/signup')
      .send(draft)

    const response = await supertest(ctMock.app).get(`/dummy/me`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual(createResponse.body.customer)
  })
})
