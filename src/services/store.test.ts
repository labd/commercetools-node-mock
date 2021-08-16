import supertest from 'supertest'
import { CommercetoolsMock } from '../index'

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
      distributionChannels: [],
    })

    const response = await supertest(ctMock.app).get(
      `/dummy/stores/key=STOREKEY`
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      createdAt: '',
      distributionChannels: [],
      id: 'fake-store',
      key: 'STOREKEY',
      lastModifiedAt: '',
      version: 1,
    })
  })

  test('Get store by 404 when not found by key', async () => {
    ctMock.project('dummy').add('store', {
      id: 'fake-store',
      version: 1,
      createdAt: '',
      lastModifiedAt: '',
      key: 'STOREKEY',
      distributionChannels: [],
    })

    const response = await supertest(ctMock.app).get(
      `/dummy/stores/key=DOESNOTEXIST`
    )

    expect(response.status).toBe(404)
  })
})
