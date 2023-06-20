import { Category } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index'

describe('Categories Query', () => {
  const ctMock = new CommercetoolsMock()

  beforeEach(async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/categories')
      .send({
        name: {
          en: 'Top hat',
        },
        slug: {
          en: 'top-hat',
        },
        orderHint: '0.1',
      })
    expect(response.status).toBe(201)
  })

  test('no filter', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/categories')
      .query({})
      .send()

    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)

    const category = response.body.results[0] as Category

    expect(category.name.en).toBe('Top hat')
  })
})
