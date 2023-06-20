import supertest from 'supertest'
import { CommercetoolsMock } from '../index'
import { afterEach, afterAll, beforeAll, describe, expect, test } from 'vitest'

const ctMock = new CommercetoolsMock()

describe('Store', () => {
  beforeAll(() => {
    ctMock.start()
  })

  afterEach(() => {
    ctMock.clear()
  })

  afterAll(() => {
    ctMock.stop()
  })

  test('Get store by key', async () => {
    ctMock.project('dummy').add('store', {
      id: 'fake-store',
      version: 1,
      createdAt: '',
      lastModifiedAt: '',
      key: 'STOREKEY',
      languages: [],
      distributionChannels: [],
      supplyChannels: [],
      productSelections: [],
    })

    const response = await supertest(ctMock.app).get(
      `/dummy/stores/key=STOREKEY`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      version: 1,
      createdAt: '',
      id: 'fake-store',
      key: 'STOREKEY',
      lastModifiedAt: '',
      languages: [],
      distributionChannels: [],
      supplyChannels: [],
      productSelections: [],
    })
  })

  test('Get store by 404 when not found by key', async () => {
    ctMock.project('dummy').add('store', {
      id: 'fake-store',
      version: 1,
      createdAt: '',
      lastModifiedAt: '',
      key: 'STOREKEY',
      languages: [],
      distributionChannels: [],
      supplyChannels: [],
      productSelections: [],
    })

    const response = await supertest(ctMock.app).get(
      `/dummy/stores/key=DOESNOTEXIST`
    )

    expect(response.status).toBe(404)
  })
})
