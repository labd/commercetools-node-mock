import { Customer } from '@commercetools/platform-sdk'
import assert from 'assert'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock, getBaseResourceProperties } from '../index'

describe('Customer Update Actions', () => {
  const ctMock = new CommercetoolsMock()
  let customer: Customer | undefined

  beforeEach(async () => {
    customer = {
      ...getBaseResourceProperties(),
      id: 'customer-uuid',
      email: 'user@example.com',
      password: 'supersecret',
      addresses: [],
      isEmailVerified: true,
      authenticationMode: 'Password', //default in Commercetools
      version: 1,
    }
    ctMock.project('dummy').add('customer', customer)
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('changeEmail', async () => {
    assert(customer, 'customer not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/customers/${customer.id}`)
      .send({
        version: 1,
        actions: [{ action: 'changeEmail', email: 'new@example.com' }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.email).toBe('new@example.com')
  })

  test('setAuthenticationMode to an invalid mode', async () => {
    assert(customer, 'customer not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/customers/${customer.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setAuthenticationMode', authMode: 'invalid' }],
      })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      'Request body does not contain valid JSON.'
    )
    expect(response.body.errors[0].code).toBe('InvalidJsonInput')
    expect(response.body.errors[0].detailedErrorMessage).toBe(
      "actions -> authMode: Invalid enum value: 'invalid'. Expected one of: 'Password','ExternalAuth'"
    )
  })

  test('setAuthenticationMode to ExternalAuth', async () => {
    assert(customer, 'customer not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/customers/${customer.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'setAuthenticationMode', authMode: 'ExternalAuth' },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.authenticationMode).toBe('ExternalAuth')
    expect(response.body.password).toBe(undefined)
  })

  test('setAuthenticationMode error when setting current authMode', async () => {
    assert(customer, 'customer not created')
    assert(
      customer.authenticationMode == 'Password',
      'customer not in default state'
    )

    const response = await supertest(ctMock.app)
      .post(`/dummy/customers/${customer.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'setAuthenticationMode',
            authMode: 'Password',
            password: 'newpass',
          },
        ],
      })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      "The customer is already using the 'Password' authentication mode."
    )
  })

  test('setAuthenticationMode to Password', async () => {
    assert(customer, 'customer not created')

    //change *away from* Password authMode (to be able to test changing *to* Password authMode)
    await supertest(ctMock.app)
      .post(`/dummy/customers/${customer.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'setAuthenticationMode', authMode: 'ExternalAuth' },
        ],
      })

    //change to Password authMode
    const response = await supertest(ctMock.app)
      .post(`/dummy/customers/${customer.id}`)
      .send({
        version: 2,
        actions: [
          {
            action: 'setAuthenticationMode',
            authMode: 'Password',
            password: 'newpass',
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(3)
    expect(response.body.authenticationMode).toBe('Password')
    expect(response.body.password).toBe(
      Buffer.from('newpass').toString('base64')
    )
  })
})
