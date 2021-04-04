import assert from 'assert';
import { Order } from '@commercetools/platform-sdk';
import supertest from 'supertest';
import { CommercetoolsMock } from '~src/index';

describe('Order Query', () => {
  const ctMock = new CommercetoolsMock();
  const app = ctMock.createApp();
  let order: Order | undefined;

  beforeEach(async () => {
    let response = await supertest(app)
      .post('/dummy/carts')
      .send({
        currency: 'EUR',
      });
    expect(response.status).toBe(200);
    const cart = response.body;

    response = await supertest(app)
      .post('/dummy/orders')
      .send({
        cart: {
          typeId: 'cart',
          id: cart.id,
        },
      });
    expect(response.status).toBe(200);
    order = response.body;
  });

  test('no filter', async () => {
    assert(order);

    const response = await supertest(app).get(`/dummy/orders`);
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.total).toBe(1);
    expect(response.body.offset).toBe(0);
    expect(response.body.limit).toBe(20);
  });
});

describe('Order Update Actions', () => {
  const ctMock = new CommercetoolsMock();
  const app = ctMock.createApp();
  let order: Order | undefined;

  beforeEach(async () => {
    let response = await supertest(app)
      .post('/dummy/carts')
      .send({
        currency: 'EUR',
      });
    expect(response.status).toBe(200);
    const cart = response.body;

    response = await supertest(app)
      .post('/dummy/orders')
      .send({
        cart: {
          typeId: 'cart',
          id: cart.id,
        },
      });
    expect(response.status).toBe(200);
    order = response.body;
  });

  test('no update', async () => {
    assert(order);

    const response = await supertest(app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setLocale', locale: 'nl-NL' }],
      });
    expect(response.status).toBe(200);
    expect(response.body.version).toBe(2);
    expect(response.body.locale).toBe('nl-NL');

    const responseAgain = await supertest(app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 2,
        actions: [{ action: 'setLocale', locale: 'nl-NL' }],
      });
    expect(responseAgain.status).toBe(200);
    expect(responseAgain.body.version).toBe(2);
    expect(responseAgain.body.locale).toBe('nl-NL');
  });

  test('setOrderNumber', async () => {
    assert(order);

    const response = await supertest(app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setOrderNumber', orderNumber: '5000123' }],
      });
    expect(response.status).toBe(200);
    expect(response.body.version).toBe(2);
    expect(response.body.orderNumber).toBe('5000123');
  });

  test('changeOrderState', async () => {
    assert(order);

    const response = await supertest(app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [{ action: 'changeOrderState', orderState: 'Complete' }],
      });
    expect(response.status).toBe(200);
    expect(response.body.version).toBe(2);
    expect(response.body.orderState).toBe('Complete');
  });

  test('changePaymentState | changeOrderState', async () => {
    assert(order);

    const response = await supertest(app)
      .post(`/dummy/orders/${order.id}`)
      .send({
        version: 1,
        actions: [
          { action: 'changeOrderState', orderState: 'Cancelled' },
          { action: 'changePaymentState', paymentState: 'Failed' },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body.version).toBe(2);
    expect(response.body.orderState).toBe('Cancelled');
    expect(response.body.paymentState).toBe('Failed');
  });
});
