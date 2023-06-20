import { CustomObject } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { getBaseResourceProperties } from '../helpers'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index'

describe('CustomObject create', () => {
  const ctMock = new CommercetoolsMock()

  test('Create new object', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/custom-objects')
      .send({
        container: 'my-container',
        key: 'my-key',
        value: 'my-value',
      })

    expect(response.status).toBe(201)
    const customObject = response.body
    expect(customObject.container).toBe('my-container')
    expect(customObject.key).toBe('my-key')
    expect(customObject.value).toBe('my-value')
  })
})

describe('CustomObject retrieve', () => {
  const ctMock = new CommercetoolsMock()
  let customObject: CustomObject

  beforeEach(async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/custom-objects')
      .send({
        container: 'my-container',
        key: 'my-key',
        value: 'my-value',
      })

    expect(response.status).toBe(201)
    customObject = response.body
    expect(customObject.container).toBe('my-container')
    expect(customObject.key).toBe('my-key')
    expect(customObject.value).toBe('my-value')
  })
  afterEach(async () => {
    ctMock.clear()
  })

  test('createget', async () => {
    const response = await supertest(ctMock.app)
      .get('/dummy/custom-objects/my-container/my-key')
      .send()

    expect(response.status).toBe(200)
    const customObject = response.body
    expect(customObject.container).toBe('my-container')
    expect(customObject.key).toBe('my-key')
    expect(customObject.value).toBe('my-value')
  })

  test('Update match current (no conflict)', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/custom-objects')
      .send({
        container: 'my-container',
        key: 'my-key',
        value: 'my-value',
      })

    expect(response.status).toBe(201)
  })

  test('New with version (errors)', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/custom-objects')
      .send({
        container: 'my-new-container',
        key: 'my-new-key',
        value: 'my-value',
        version: 2,
      })

    expect(response.status).toBe(400)
    expect(response.body).toStrictEqual({
      statusCode: 400,
      message: 'version on create must be 0',
      errors: [
        {
          code: 'InvalidOperation',
          message: 'version on create must be 0',
        },
      ],
    })
  })

  test('Update match current with version (conflict)', async () => {
    const response = await supertest(ctMock.app)
      .post('/dummy/custom-objects')
      .send({
        container: 'my-container',
        key: 'my-key',
        value: 'my-value',
        version: 2,
      })

    expect(response.status).toBe(409)
    expect(response.body).toStrictEqual({
      statusCode: 409,
      message: `Object ${customObject.id} has a different version than expected. Expected: 2 - Actual: 1.`,
      errors: [
        {
          code: 'ConcurrentModification',
          currentVersion: 1,
          message: `Object ${customObject.id} has a different version than expected. Expected: 2 - Actual: 1.`,
        },
      ],
    })
  })

  test('can use the add function with the custom object name', async () => {
    ctMock.project('dummy').add('key-value-document', {
      ...getBaseResourceProperties(),
      container: 'my-container',
      key: 'my-key',
      value: 'my-value',
      version: 2,
    })

    const response = await supertest(ctMock.app)
      .get('/dummy/custom-objects/my-container/my-key')
      .send()

    expect(response.status).toEqual(200)
    expect(response.body).toEqual({
      container: 'my-container',
      createdAt: expect.anything(),
      id: expect.anything(),
      key: 'my-key',
      lastModifiedAt: expect.anything(),
      value: 'my-value',
      version: 1,
    })
  })

  test('update with container and key', async () => {
    ctMock.project('dummy').add('key-value-document', {
      ...getBaseResourceProperties(),
      container: 'my-other-container',
      key: 'my-key',
      value: 'my-value',
      version: 2,
    })

    const response = await supertest(ctMock.app)
      .post('/dummy/custom-objects/my-other-container/my-key')
      .send({
        value: 'new-value',
      })

    expect(response.status).toEqual(200)
    expect(response.body).toEqual({
      container: 'my-other-container',
      createdAt: expect.anything(),
      id: expect.anything(),
      key: 'my-key',
      lastModifiedAt: expect.anything(),
      value: 'new-value',
      version: 3,
    })
  })

  test('delete with container and key', async () => {
    const response = await supertest(ctMock.app)
      .delete('/dummy/custom-objects/my-container/my-key')
      .send()

    expect(response.status).toEqual(200)
    expect(response.body).toEqual({
      container: 'my-container',
      createdAt: expect.anything(),
      id: expect.anything(),
      key: 'my-key',
      lastModifiedAt: expect.anything(),
      value: 'my-value',
      version: 1,
    })

    const fetchRes = await supertest(ctMock.app)
      .get('/dummy/custom-objects/my-container/my-key')
      .send()

    expect(fetchRes.status).toEqual(404)
  })
})
