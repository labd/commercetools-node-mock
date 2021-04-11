import nock from 'nock'
import express, { NextFunction, Request, Response } from 'express'
import supertest from 'supertest'
import morgan from 'morgan'
import { AbstractStorage, InMemoryStorage } from './storage'
import { ReferenceTypeId } from '@commercetools/platform-sdk'
import AbstractService from './services/abstract'
import { TypeService } from './services/type'
import { CustomObjectService } from './services/custom-object'
import { CustomerService } from './services/customer'
import { CartService } from './services/cart'
import { OrderService } from './services/order'
import { RepositoryMap, ResourceMap } from 'types'
import { StoreService } from './services/store'
import { CommercetoolsError } from './exceptions'
import { OAuth2Server } from './oauth/server'
import { DEFAULT_API_HOSTNAME, DEFAULT_AUTH_HOSTNAME } from './constants'

export type CommercetoolsMockOptions = {
  validateCredentials: boolean
  enableAuthentication: boolean
  apiHost: RegExp | string
  authHost: RegExp | string
}

const DEFAULT_OPTIONS = {
  enableAuthentication: false,
  validateCredentials: false,
  apiHost: DEFAULT_API_HOSTNAME,
  authHost: DEFAULT_AUTH_HOSTNAME,
}

export class CommercetoolsMock {
  private _storage: AbstractStorage
  private _app: express.Express
  private _oauth2: OAuth2Server
  private _nockScopes: {
    auth: nock.Scope | undefined
    api: nock.Scope | undefined
  } = { auth: undefined, api: undefined }
  private _options: CommercetoolsMockOptions
  private _services: Partial<
    {
      [index in ReferenceTypeId]: AbstractService
    }
  > = {}

  constructor(options: Partial<CommercetoolsMockOptions> = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options }

    this._storage = new InMemoryStorage()
    this._oauth2 = new OAuth2Server({
      enabled: this._options.enableAuthentication,
      validate: this._options.validateCredentials,
    })

    this._app = this.createApp()
  }

  start() {
    // Order is important here when the hostnames match
    this.mockAuthHost()
    this.mockApiHost()
  }

  stop() {
    this._nockScopes.auth?.persist(false)
    this._nockScopes.auth = undefined

    this._nockScopes.api?.persist(false)
    this._nockScopes.api = undefined
  }

  clear() {
    this._storage.clear()
  }

  addResource<ReferenceTypeId extends keyof ResourceMap>(
    projectKey: string,
    typeId: ReferenceTypeId,
    resource: ResourceMap[ReferenceTypeId]
  ) {
    const service = this._services[typeId]
    if (service) {
      this._storage.add(projectKey, typeId, {
        ...service.repository.getResourceProperties(),
        ...resource,
      })
    } else {
      throw new Error('Service not implemented yet')
    }
  }

  getResource<ReferenceTypeId extends keyof ResourceMap>(
    projectKey: string,
    typeId: ReferenceTypeId,
    id: string
  ): ResourceMap[ReferenceTypeId] {
    return this._storage.get(
      projectKey,
      typeId,
      id,
      {}
    ) as ResourceMap[ReferenceTypeId]
  }

  createApp(): express.Express {
    const app = express()
    this.register(app)
    return app
  }

  runServer(port: number = 3000) {
    const app = this.createApp()
    app.listen(port, () => {
      console.log(`Mock server listening at http://localhost:${port}`)
    })
  }

  // TODO: Not sure if we want to expose this...
  getRepository<ReferenceTypeId extends keyof RepositoryMap>(
    typeId: ReferenceTypeId
  ): RepositoryMap[ReferenceTypeId] {
    const service = this._services[typeId]
    if (service !== undefined) {
      return service.repository as RepositoryMap[ReferenceTypeId]
    }
    throw new Error('No such repository')
  }

  private register(app: express.Express) {
    const projectRouter = express.Router({ mergeParams: true })
    projectRouter.use(express.json())

    app.use(morgan('tiny'))
    app.use('/oauth', this._oauth2.createRouter())

    // Only enable auth middleware if we have enabled this
    if (this._options.enableAuthentication) {
      app.use('/:projectKey', this._oauth2.createMiddleware(), projectRouter)
    } else {
      app.use('/:projectKey', projectRouter)
    }

    this._services = {
      cart: new CartService(projectRouter, this._storage),
      customer: new CustomerService(projectRouter, this._storage),
      'key-value-document': new CustomObjectService(
        projectRouter,
        this._storage
      ),
      order: new OrderService(projectRouter, this._storage),
      store: new StoreService(projectRouter, this._storage),
      type: new TypeService(projectRouter, this._storage),
    }

    app.use((err: Error, req: Request, resp: Response, next: NextFunction) => {
      if (err instanceof CommercetoolsError) {
        return resp.status(err.statusCode).send({
          statusCode: err.statusCode,
          message: err.message,
          errors: [err.info],
        })
      } else {
        return resp.status(500).send({
          error: 'Unhandled error',
        })
      }
    })
  }

  private mockApiHost() {
    const app = this._app

    this._nockScopes.api = nock(this._options.apiHost)
      .persist()
      .get(/.*/)
      .reply(async function(uri) {
        const response = await supertest(app)
          .get(uri)
          .set(this.req.headers)
        return [response.status, response.body]
      })
      .post(/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .post(uri)
          .set(this.req.headers)
          .send(body)
        return [response.status, response.body]
      })
      .delete(/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .delete(uri)
          .set(this.req.headers)
          .send(body)
        return [response.status, response.body]
      })
  }

  private mockAuthHost() {
    const app = this._app

    this._nockScopes.auth = nock(this._options.authHost)
      .persist()
      .post(/^\/oauth\/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .post(uri)
          .set(this.req.headers)
          .send(body)
        return [response.status, response.body]
      })
  }
}
