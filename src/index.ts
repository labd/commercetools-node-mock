import nock from 'nock';
import express from 'express';
import supertest from 'supertest';
import morgan from 'morgan';
import {
  CartService,
  CustomerService,
  CustomObjectService,
  OrderService,
} from './services';
import {
  CartRepository,
  CustomerRepository,
  CustomObjectRepository,
  OrderRepository,
} from './repositories';
import { AbstractStorage, InMemoryStorage } from './storage';
import { BaseResource, ReferenceTypeId } from '@commercetools/platform-sdk';
import AbstractService from './services/abstract';
import AbstractRepository from './repositories/abstract';

export class CommercetoolsMock {
  private _storage: AbstractStorage;
  private _repositories: Array<AbstractRepository> = [];
  private _services: Array<AbstractService> = [];

  constructor() {
    this._storage = new InMemoryStorage();
  }

  mockHttp(url: string) {
    const app = this.createApp();

    nock(url)
      .persist()
      .get(/.*/)
      .reply(async function(uri) {
        const response = await supertest(app).get(uri);
        return [response.status, response.body];
      })
      .post(/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .post(uri)
          .send(body);
        return [response.status, response.body];
      })
      .delete(/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .delete(uri)
          .send(body);
        return [response.status, response.body];
      });
  }

  addResource(typeId: ReferenceTypeId, resource: BaseResource) {
    this._storage.add(typeId, resource);
  }

  getResource(typeId: ReferenceTypeId, id: string) {
    return this._storage.get(typeId, id);
  }

  createApp(): express.Express {
    const app = express();
    this.register(app);
    return app;
  }

  run(port: number = 3000) {
    const app = this.createApp();
    app.listen(port, () => {
      console.log(`Mock server listening at http://localhost:${port}`);
    });
  }

  register(app: express.Express) {
    const projectRouter = express.Router();
    projectRouter.use(express.json());

    app.use(morgan('tiny'));
    app.use('/:projectKey', projectRouter);

    const cartRepository = new CartRepository(this._storage);
    const customerRepository = new CustomerRepository(this._storage);
    const customObjectRepository = new CustomObjectRepository(this._storage);
    const orderRepository = new OrderRepository(this._storage);

    this._services.push(
      new CartService(projectRouter, cartRepository),
      new CustomerService(projectRouter, customerRepository),
      new CustomObjectService(projectRouter, customObjectRepository),
      new OrderService(projectRouter, orderRepository)
    );
  }
}
