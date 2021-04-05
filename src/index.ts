import nock from 'nock';
import express, { NextFunction, Request, Response } from 'express';
import supertest from 'supertest';
import morgan from 'morgan';
import { AbstractStorage, InMemoryStorage } from './storage';
import { BaseResource, ReferenceTypeId } from '@commercetools/platform-sdk';
import AbstractService from './services/abstract';
import AbstractRepository from './repositories/abstract';
import { TypeService } from './services/type';
import { CustomObjectService } from './services/custom-object';
import { CustomerService } from './services/customer';
import { CartService } from './services/cart';
import { OrderService } from './services/order';
import { RepositoryMap, ResourceMap } from 'types';

export class CommercetoolsMock {
  private _storage: AbstractStorage;
  private _repositories: Array<AbstractRepository> = [];
  private _services: Partial<
    {
      [index in ReferenceTypeId]: AbstractService;
    }
  > = {};

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

  addResource<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    resource: ResourceMap[ReferenceTypeId]
  ) {
    const service = this._services[typeId];
    if (service) {
      this._storage.add(typeId, {
        ...service.repository.getResourceProperties(),
        ...resource,
      });
    } else {
      throw new Error('Service not implemented yet');
    }
  }

  getResource<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    id: string
  ): ResourceMap[ReferenceTypeId] {
    return this._storage.get(typeId, id) as ResourceMap[ReferenceTypeId];
  }

  // TODO: Not sure if we want to expose this...
  getRepository<ReferenceTypeId extends keyof RepositoryMap>(
    typeId: ReferenceTypeId
  ): RepositoryMap[ReferenceTypeId] {
    const service = this._services[typeId];
    if (service !== undefined) {
      return service.repository as RepositoryMap[ReferenceTypeId];
    }
    throw new Error('No such repository');
  }

  createApp(): express.Express {
    const app = express();
    this.register(app);
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.info(err);
      res.status(500).send('Something broke!');
    });

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

    this._services = {
      cart: new CartService(projectRouter, this._storage),
      customer: new CustomerService(projectRouter, this._storage),
      'key-value-document': new CustomObjectService(
        projectRouter,
        this._storage
      ),
      order: new OrderService(projectRouter, this._storage),
      type: new TypeService(projectRouter, this._storage),
    };
  }
}
