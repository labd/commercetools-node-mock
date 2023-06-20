import { InvalidTokenError } from '@commercetools/platform-sdk'
import { CommercetoolsMock } from './index'
import { afterEach, beforeEach, expect, test } from 'vitest'
import nock from 'nock'
import got from 'got'

beforeEach(() => {
  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1') // supertest
})
afterEach(() => {
  nock.enableNetConnect()
  nock.cleanAll()
})

test('Default mock endpoints', async () => {
  const ctMock = new CommercetoolsMock({
    enableAuthentication: true,
    validateCredentials: true,
  })
  ctMock.start()

  let response = await got.post<{ access_token: string }>(
    'https://auth.europe-west1.gcp.commercetools.com/oauth/token',
    {
      searchParams: {
        grant_type: 'client_credentials',
        scope: 'manage_project:commercetools-node-mock',
      },
      username: 'foo',
      password: 'bar',
      responseType: 'json',
    }
  )
  expect(response.statusCode).toBe(200)

  const token = response.body.access_token
  expect(response.body.access_token).toBeDefined()
  response = await got.get(
    'https://api.europe-west1.gcp.commercetools.com/my-project/orders',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'json',
    }
  )
  expect(response.statusCode).toBe(200)
  expect(response.body).toStrictEqual({
    count: 0,
    total: 0,
    offset: 0,
    limit: 20,
    results: [],
  })
  ctMock.stop()
})

test('Options.validateCredentials: true (error)', async () => {
  const ctMock = new CommercetoolsMock({
    enableAuthentication: true,
    validateCredentials: true,
  })
  ctMock.start()

  const response = await got.get<InvalidTokenError>(
    'https://api.europe-west1.gcp.commercetools.com/my-project/orders',
    {
      headers: {
        Authorization: `Bearer foobar`,
      },
      responseType: 'json',
      throwHttpErrors: false,
    }
  )
  expect(response.statusCode).toBe(401)
  expect(response.body.message).toBe('invalid_token')
  ctMock.stop()
})

test('Options.validateCredentials: false', async () => {
  const ctMock = new CommercetoolsMock({
    enableAuthentication: true,
    validateCredentials: false,
  })
  ctMock.start()

  const response = await got.get(
    'https://api.europe-west1.gcp.commercetools.com/my-project/orders',
    {
      headers: {
        Authorization: `Bearer foobar`,
      },
      responseType: 'json',
    }
  )
  expect(response.statusCode).toBe(200)
  expect(response.body).toStrictEqual({
    count: 0,
    total: 0,
    offset: 0,
    limit: 20,
    results: [],
  })
  ctMock.stop()
})

test('Options.enableAuthentication: false', async () => {
  const ctMock = new CommercetoolsMock({
    enableAuthentication: false,
    validateCredentials: false,
  })
  ctMock.start()

  const response = await got.get(
    'https://api.europe-west1.gcp.commercetools.com/my-project/orders',
    {
      responseType: 'json',
    }
  )
  expect(response.statusCode).toBe(200)
  expect(response.body).toStrictEqual({
    count: 0,
    total: 0,
    offset: 0,
    limit: 20,
    results: [],
  })
  ctMock.stop()
})

test('Options.apiHost: is overridden is set', async () => {
  const ctMock = new CommercetoolsMock({
    enableAuthentication: false,
    validateCredentials: false,
    apiHost: 'http://api.localhost',
  })
  ctMock.start()

  const response = await got.get('http://api.localhost/my-project/orders', {
    responseType: 'json',
  })
  expect(response.statusCode).toBe(200)
  expect(response.body).toStrictEqual({
    count: 0,
    total: 0,
    offset: 0,
    limit: 20,
    results: [],
  })
  ctMock.stop()
})

test('Options.authHost: is set', async () => {
  const ctMock = new CommercetoolsMock({
    enableAuthentication: true,
    validateCredentials: true,
    authHost: 'http://auth.localhost',
  })
  ctMock.start()

  const response = await got.post<{ access_token: string }>(
    'http://auth.localhost/oauth/token',
    {
      searchParams: {
        grant_type: 'client_credentials',
        scope: 'manage_project:commercetools-node-mock',
      },
      username: 'foo',
      password: 'bar',
      responseType: 'json',
    }
  )
  expect(response.statusCode).toBe(200)

  const token = response.body.access_token
  expect(token).toBeDefined()
})

test('apiHost mock proxy: querystring', async () => {
  const ctMock = new CommercetoolsMock({
    enableAuthentication: false,
    validateCredentials: false,
    apiHost: 'http://api.localhost',
  })
  ctMock.start()

  const response = await got.get('http://api.localhost/my-project/orders', {
    responseType: 'json',
    searchParams: {
      where: 'orderNumber="foobar"',
      expand: 'custom.type',
    },
  })
  expect(response.statusCode).toBe(200)
  expect(response.body).toStrictEqual({
    count: 0,
    total: 0,
    offset: 0,
    limit: 20,
    results: [],
  })
  ctMock.stop()
})
