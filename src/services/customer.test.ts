import assert from 'assert'
import { Customer } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock, getBaseResourceProperties } from '../index'

describe('Customer Update Actions', () => {
  const ctMock = new CommercetoolsMock()
  let customer: Customer | undefined

  beforeEach(async () => {
    customer = {
      ...getBaseResourceProperties(),
      id: 'customer-uuid',
      email: 'user@example.com',
      addresses: [],
      isEmailVerified: true,
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
})
