import assert from 'assert';
import { Cart, Order } from '@commercetools/platform-sdk';
import supertest from 'supertest';
import { CommercetoolsMock } from '../index';

describe('Carts Query', () => {
  const ctMock = new CommercetoolsMock();
  const app = ctMock.createApp();

  beforeEach(async () => {
    let response;
    response = await supertest(app)
      .post('/dummy/types')
      .send({
        key: 'my-cart',
        name: {
          en: 'Test',
        },
        description: {
          en: 'Test Type',
        },
        resourceTypeIds: ['order'],
        fieldDefinitions: [
          {
            name: 'offer_name',
            label: {
              en: 'offer_name',
            },
            required: false,
            type: {
              name: 'String',
            },
            inputHint: 'SingleLine',
          },
        ],
      });
    expect(response.status).toBe(200);

    response = await supertest(app)
      .post('/dummy/carts')
      .send({
        currency: 'EUR',
        custom: {
          type: {
            typeId: 'type',
            key: 'my-cart',
          },
          fields: {
            description: 'example description',
          },
        },
      });
    expect(response.status).toBe(200);
  });

  test('no filter', async () => {
    const response = await supertest(app)
      .get('/dummy/carts')
      .query({
        expand: 'custom.type',
      })
      .send();

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);

    const myCart = response.body.results[0] as Cart;

    expect(myCart.custom?.type.id).not.toBeUndefined();
    expect(myCart.custom?.type.id).toBe(myCart.custom?.type.obj?.id);
    expect(myCart.custom?.type.obj?.description?.en).toBe('Test Type');
  });
});
