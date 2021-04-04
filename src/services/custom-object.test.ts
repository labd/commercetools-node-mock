import supertest from 'supertest';
import { CommercetoolsMock } from '~src/index';

describe('CustomObject create', () => {
  const ctMock = new CommercetoolsMock();
  const app = ctMock.createApp();

  test('createget', async () => {
    let response = await supertest(app)
      .post('/dummy/custom-objects')
      .send({
        container: 'my-container',
        key: 'my-key',
        value: 'my-value',
      });

    expect(response.status).toBe(200);
    const customObject = response.body;
    expect(customObject.container).toBe('my-container');
    expect(customObject.key).toBe('my-key');
    expect(customObject.value).toBe('my-value');
  });
});

describe('CustomObject retrieve', () => {
  const ctMock = new CommercetoolsMock();
  const app = ctMock.createApp();

  beforeEach(async () => {
    let response = await supertest(app)
      .post('/dummy/custom-objects')
      .send({
        container: 'my-container',
        key: 'my-key',
        value: 'my-value',
      });

    expect(response.status).toBe(200);
    const customObject = response.body;
    expect(customObject.container).toBe('my-container');
    expect(customObject.key).toBe('my-key');
    expect(customObject.value).toBe('my-value');
  });

  test('createget', async () => {
    let response = await supertest(app)
      .get('/dummy/custom-objects/my-container/my-key')
      .send();

    expect(response.status).toBe(200);
    const customObject = response.body;
    expect(customObject.container).toBe('my-container');
    expect(customObject.key).toBe('my-key');
    expect(customObject.value).toBe('my-value');
  });
});
