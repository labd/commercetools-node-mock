import assert from 'assert'
import { Order, Payment, State } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock, getBaseResourceProperties } from '../index'

describe('Order Query', () => {
  const ctMock = new CommercetoolsMock()
  let order: Order | undefined

  beforeEach(async () => {
    let response = await supertest(ctMock.app)
      .post('/dummy/carts')
      .send({
        currency: 'EUR',
        custom: {
          type: {
            key: 'my-cart',
          },
          fields: {
            description: 'example description',
          },
        },
      })
    expect(response.status).toBe(200)
    const cart = response.body

    response = await supertest(ctMock.app)
      .post('/dummy/orders')
      .send({
        cart: {
          typeId: 'cart',
          id: cart.id,
        },
        orderNumber: 'foobar',
      })
    expect(response.status).toBe(200)
    order = response.body
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('no filter', async () => {
    assert(order, 'order not created')

    const response = await supertest(ctMock.app).get(`/dummy/orders`)
    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)
    expect(response.body.total).toBe(1)
    expect(response.body.offset).toBe(0)
    expect(response.body.limit).toBe(20)
  })

  test('filter orderNumber', async () => {
    assert(order, 'order not created')

    {
      const response = await supertest(ctMock.app)
        .get(`/dummy/orders`)
        .query({ where: 'orderNumber="nomatch"' })
      expect(response.status).toBe(200)
      expect(response.body.count).toBe(0)
    }
    {
      const response = await supertest(ctMock.app)
        .get(`/dummy/orders`)
        .query({ where: 'orderNumber="foobar"' })
      expect(response.status).toBe(200)
      expect(response.body.count).toBe(1)
    }
  })

  test('expand payment without payments', async () => {
    assert(order, 'order not created')

    const response = await supertest(ctMock.app)
      .get(`/dummy/orders/${order.id}`)
      .query({ expand: 'paymentInfo.payments[*].paymentStatus.state' })

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(order.id)
  })
})

describe('Order payment tests', () => {
  const ctMock = new CommercetoolsMock({
    defaultProjectKey: 'dummy',
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('query payment id', async () => {
    const state: State = {
      ...getBaseResourceProperties(),
      builtIn: false,
      initial: false,
      key: 'PaymentSuccess',
      type: 'PaymentState',
    }

    const payment: Payment = {
      ...getBaseResourceProperties(),
      interfaceInteractions: [],
      paymentStatus: {
        state: {
          typeId: 'state',
          id: state.id,
        },
      },
      amountPlanned: {
        type: 'centPrecision',
        fractionDigits: 2,
        centAmount: 1234,
        currencyCode: 'EUR',
      },
      paymentMethodInfo: {
        paymentInterface: 'buckaroo',
        method: 'mastercard',
      },
      version: 2,
      transactions: [
        {
          id: 'fake-transaction-id',
          type: 'Charge',
          amount: {
            centAmount: 1234,
            currencyCode: 'EUR',
            type: 'centPrecision',
            fractionDigits: 2,
          },
          state: 'Success',
        },
      ],
    }

    const order: Order = {
      customLineItems: [],
      lastMessageSequenceNumber: 0,
      lineItems: [],
      orderState: 'Open',
      origin: 'Customer',
      refusedGifts: [],
      syncInfo: [],
      totalPrice: {
        type: 'centPrecision',
        fractionDigits: 2,
        centAmount: 2000,
        currencyCode: 'EUR',
      },
      ...getBaseResourceProperties(),
      orderNumber: '1337',
      paymentInfo: {
        payments: [
          {
            typeId: 'payment',
            id: payment.id,
          },
        ],
      },
    }

    ctMock.project().add('state', state)
    ctMock.project().add('payment', payment)
    ctMock.project().add('order', order)

    const response = await supertest(ctMock.app)
      .get(`/dummy/orders`)
      .query({ where: `paymentInfo(payments(id="${payment.id}"))` })

    expect(response.status).toBe(200)
    expect(response.body.results[0].id).toBe(order.id)

    {
      const response = await supertest(ctMock.app)
        .get(`/dummy/orders`)
        .query({ where: `paymentInfo(payments(id is defined))` })

      expect(response.status).toBe(200)
      expect(response.body.results[0].id).toBe(order.id)
    }
  })

  test('expand payment states', async () => {
    const state: State = {
      ...getBaseResourceProperties(),
      builtIn: false,
      initial: false,
      key: 'PaymentSuccess',
      type: 'PaymentState',
    }

    const payment: Payment = {
      ...getBaseResourceProperties(),
      interfaceInteractions: [],
      paymentStatus: {
        state: {
          typeId: 'state',
          id: state.id,
        },
      },
      amountPlanned: {
        type: 'centPrecision',
        fractionDigits: 2,
        centAmount: 1234,
        currencyCode: 'EUR',
      },
      paymentMethodInfo: {
        paymentInterface: 'buckaroo',
        method: 'mastercard',
      },
      version: 2,
      transactions: [
        {
          id: 'fake-transaction-id',
          type: 'Charge',
          amount: {
            centAmount: 1234,
            currencyCode: 'EUR',
            type: 'centPrecision',
            fractionDigits: 2,
          },
          state: 'Success',
        },
      ],
    }

    const order: Order = {
      customLineItems: [],
      lastMessageSequenceNumber: 0,
      lineItems: [],
      orderState: 'Open',
      origin: 'Customer',
      refusedGifts: [],
      syncInfo: [],
      totalPrice: {
        type: 'centPrecision',
        fractionDigits: 2,
        centAmount: 2000,
        currencyCode: 'EUR',
      },
      ...getBaseResourceProperties(),
      orderNumber: '1337',
      paymentInfo: {
        payments: [
          {
            typeId: 'payment',
            id: payment.id,
          },
        ],
      },
    }

    ctMock.project().add('state', state)
    ctMock.project().add('payment', payment)
    ctMock.project().add('order', order)

    const response = await supertest(ctMock.app)
      .get(`/dummy/orders/order-number=${order.orderNumber}`)
      .query({ expand: 'paymentInfo.payments[*].paymentStatus.state' })

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(order.id)
    const maybePayment = response.body.paymentInfo.payments[0].obj
    expect(maybePayment).toBeDefined()
    expect(maybePayment.paymentStatus.state.obj).toBeDefined()
  })
})

describe('Order Update Actions', () => {
  const ctMock = new CommercetoolsMock()
  let order: Order | undefined

  beforeEach(async () => {
    let response = await supertest(ctMock.app)
      .post('/dummy/carts')
      .send({
        currency: 'EUR',
      })
    expect(response.status).toBe(200)
    const cart = response.body

    response = await supertest(ctMock.app)
      .post('/dummy/orders')
      .send({
        cart: {
          typeId: 'cart',
          id: cart.id,
        },
      })
    expect(response.status).toBe(200)
    order = response.body
  })

  test('no update', async () => {
    assert(order, 'order not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setLocale', locale: 'nl-NL' }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.locale).toBe('nl-NL')

    const responseAgain = await supertest(ctMock.app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 2,
        actions: [{ action: 'setLocale', locale: 'nl-NL' }],
      })
    expect(responseAgain.status).toBe(200)
    expect(responseAgain.body.version).toBe(2)
    expect(responseAgain.body.locale).toBe('nl-NL')
  })

  test('setOrderNumber', async () => {
    assert(order, 'order not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setOrderNumber', orderNumber: '5000123' }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.orderNumber).toBe('5000123')
  })

  test('changeOrderState', async () => {
    assert(order, 'order not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [{ action: 'changeOrderState', orderState: 'Complete' }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.orderState).toBe('Complete')
  })

  test('changePaymentState | changeOrderState', async () => {
    assert(order, 'order not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'changeOrderState', orderState: 'Cancelled' },
          { action: 'changePaymentState', paymentState: 'Failed' },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.orderState).toBe('Cancelled')
    expect(response.body.paymentState).toBe('Failed')
  })
})

describe('Order Import', () => {
  const ctMock = new CommercetoolsMock()
  ctMock.project('dummy').add('product', {
    id: '15fc56ba-a74e-4cf8-b4b0-bada5c101541',
    // @ts-ignore
    masterData: {
      // @ts-ignore
      current: {
        name: { 'nl-NL': 'Dummy' },
        slug: { 'nl-NL': 'Dummy' },
        categories: [],
        masterVariant: {
          id: 0,
          sku: 'MYSKU',
        },
        variants: [],
      },
    },
  })

  test('Import', async () => {
    const response = await supertest(ctMock.app)
      .post(`/dummy/orders/import`)
      .send({
        orderNumber: '100000001',
        totalPrice: {
          centAmount: 1000,
          currencyCode: 'EUR',
        },
        customLineItems: [
          {
            name: {
              'nl-NL': 'Something',
            },
            slug: 'my-slug',
            money: {
              centAmount: 1475,
              currencyCode: 'EUR',
            },
            quantity: 1,
            // custom: {
            //   type: {
            //     typeId: 'type',
            //     key: 'myCustomLineItem',
            //   },
            //   fields: {
            //     myCustomField: 'myCustomValeu',
            //   },
            // },
          },
        ],
        lineItems: [
          {
            productId: 'PRODUCTID',
            name: {
              'en-US': 'The product',
            },
            variant: {
              id: 1,
              sku: 'MYSKU',
              prices: [
                {
                  value: {
                    currencyCode: 'EUR',
                    centAmount: 14900,
                  },
                  country: 'NL',
                  // channel: {
                  //   typeId: 'channel',
                  //   id: '411485eb-7875-46f4-8d40-1db9e61374ed',
                  // },
                  // custom: {
                  //   type: {
                  //     typeId: 'type',
                  //     id: '55071385-b6e4-44c4-8c4b-6f2ec0f23649',
                  //   },
                  //   fields: {},
                  // },
                },
              ],
              images: [],
              attributes: [],
            },
            price: {
              value: {
                currencyCode: 'EUR',
                centAmount: 14900,
              },
              country: 'NL',
              // channel: {
              //   typeId: 'channel',
              //   id: '411485eb-7875-46f4-8d40-1db9e61374ed',
              // },
              // custom: {
              //   type: {
              //     typeId: 'type',
              //     id: '55071385-b6e4-44c4-8c4b-6f2ec0f23649',
              //   },
              //   fields: {},
              // },
            },
            quantity: 3,
            // distributionChannel: {
            //   typeId: 'channel',
            //   id: '411485eb-7875-46f4-8d40-1db9e61374ed',
            // },
            taxRate: {
              name: '21% BTW',
              amount: 0.21,
              includedInPrice: true,
              country: 'NL',
              id: 'Z0wLUuYw',
              subRates: [],
            },
            // state: [
            //   {
            //     quantity: 3,
            //     state: {
            //       typeId: 'state',
            //       id: 'f1d9531d-41f0-46a7-82f2-c4b0748aa9f5',
            //     },
            //   },
            // ],
          },
        ],
      })

    console.log(JSON.stringify(response.body))
    expect(response.status).toBe(200)

    const created: Order = response.body
    expect(created.lineItems).toHaveLength(1)
    expect(created.customLineItems).toHaveLength(1)
  })
})
