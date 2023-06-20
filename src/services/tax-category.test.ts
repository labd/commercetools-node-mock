import { TaxCategoryDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { afterEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index'

const ctMock = new CommercetoolsMock()

describe('Tax Category', () => {
  afterEach(() => {
    ctMock.clear()
  })
  test('Create tax category', async () => {
    const draft: TaxCategoryDraft = {
      name: 'foo',
      key: 'standard',
      rates: [],
    }
    const response = await supertest(ctMock.app)
      .post('/dummy/tax-categories')
      .send(draft)

    expect(response.status).toBe(201)

    expect(response.body).toEqual({
      createdAt: expect.anything(),
      id: expect.anything(),
      lastModifiedAt: expect.anything(),
      name: 'foo',
      rates: [],
      key: 'standard',
      version: 1,
    })
  })

  test('Get tax category', async () => {
    const draft: TaxCategoryDraft = {
      name: 'foo',
      key: 'standard',
      rates: [],
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/tax-categories')
      .send(draft)

    expect(createResponse.status).toBe(201)

    const response = await supertest(ctMock.app).get(
      `/dummy/tax-categories/${createResponse.body.id}`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual(createResponse.body)
  })

  test('Get tax category with key', async () => {
    const draft: TaxCategoryDraft = {
      name: 'foo',
      key: 'standard',
      rates: [],
    }
    const createResponse = await supertest(ctMock.app)
      .post('/dummy/tax-categories')
      .send(draft)

    expect(createResponse.status).toBe(201)

    const response = await supertest(ctMock.app)
      .get(`/dummy/tax-categories/`)
      .query({ where: `key="${createResponse.body.key}"` })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      count: 1,
      limit: 20,
      offset: 0,
      total: 1,
      results: [createResponse.body],
    })
  })
})
