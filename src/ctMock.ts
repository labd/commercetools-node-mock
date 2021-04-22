import { ProductTypeService } from './services/product-type'
import { ShippingMethodService } from './services/shipping-method'
import { StateService } from './services/state'
import { TaxCategoryService } from './services/tax-category'
import { PaymentService } from './services/payment'
import nock from 'nock'
import express, { NextFunction, Request, Response } from 'express'
import supertest from 'supertest'
import morgan from 'morgan'
import { AbstractStorage, InMemoryStorage } from './storage'
import { TypeService } from './services/type'
import { CustomObjectService } from './services/custom-object'
import { CustomerService } from './services/customer'
import { CartService } from './services/cart'
import { InventoryEntryService } from './services/inventory-entry'
import { OrderService } from './services/order'
import { Services } from 'types'
import { StoreService } from './services/store'
import { CommercetoolsError } from './exceptions'
import { OAuth2Server } from './oauth/server'
import { DEFAULT_API_HOSTNAME, DEFAULT_AUTH_HOSTNAME } from './constants'
import { ProjectAPI } from './projectAPI'
import { copyHeaders } from './lib/proxy'

export type CommercetoolsMockOptions = {
  validateCredentials: boolean
  enableAuthentication: boolean
  defaultProjectKey: string | undefined
  apiHost: RegExp | string
  authHost: RegExp | string
  silent: boolean
}

type AppOptions = { silent?: boolean }

const DEFAULT_OPTIONS: CommercetoolsMockOptions = {
  enableAuthentication: false,
  validateCredentials: false,
  defaultProjectKey: undefined,
  apiHost: DEFAULT_API_HOSTNAME,
  authHost: DEFAULT_AUTH_HOSTNAME,
  silent: false,
}

export class CommercetoolsMock {
  public app: express.Express
  public options: CommercetoolsMockOptions

  private _storage: AbstractStorage
  private _oauth2: OAuth2Server
  private _nockScopes: {
    auth: nock.Scope | undefined
    api: nock.Scope | undefined
  } = { auth: undefined, api: undefined }
  private _services: Services

  constructor(options: Partial<CommercetoolsMockOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this._services = {}

    this._storage = new InMemoryStorage()
    this._oauth2 = new OAuth2Server({
      enabled: this.options.enableAuthentication,
      validate: this.options.validateCredentials,
    })

    this.app = this.createApp({ silent: this.options.silent })
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

  project(projectKey?: string) {
    if (!projectKey && !this.options.defaultProjectKey) {
      throw new Error('No projectKey passed and no default set')
    }

    return new ProjectAPI(
      projectKey || this.options.defaultProjectKey!,
      this._services,
      this._storage
    )
  }

  runServer(port: number = 3000, options?: AppOptions) {
    const app = this.createApp(options)
    app.listen(port, () => {
      console.log(`Mock server listening at http://localhost:${port}`)
    })
  }

  private createApp(options?: AppOptions): express.Express {
    const app = express()

    const projectRouter = express.Router({ mergeParams: true })
    projectRouter.use(express.json())

    if (!options?.silent) {
      app.use(morgan('tiny'))
    }
    app.use('/oauth', this._oauth2.createRouter())

    // Only enable auth middleware if we have enabled this
    if (this.options.enableAuthentication) {
      app.use('/:projectKey', this._oauth2.createMiddleware(), projectRouter)
    } else {
      app.use('/:projectKey', projectRouter)
    }

    this._services = {
      cart: new CartService(projectRouter, this._storage),
      customer: new CustomerService(projectRouter, this._storage),
      'inventory-entry': new InventoryEntryService(
        projectRouter,
        this._storage
      ),
      'key-value-document': new CustomObjectService(
        projectRouter,
        this._storage
      ),
      order: new OrderService(projectRouter, this._storage),
      payment: new PaymentService(projectRouter, this._storage),
      'shipping-method': new ShippingMethodService(
        projectRouter,
        this._storage
      ),
      'product-type': new ProductTypeService(projectRouter, this._storage),
      state: new StateService(projectRouter, this._storage),
      store: new StoreService(projectRouter, this._storage),
      'tax-category': new TaxCategoryService(projectRouter, this._storage),
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
          error: err.message,
        })
      }
    })

    return app
  }

  private mockApiHost() {
    const app = this.app

    this._nockScopes.api = nock(this.options.apiHost)
      .persist()
      .get(/.*/)
      .reply(async function(uri) {
        const response = await supertest(app)
          .get(uri)
          .set(copyHeaders(this.req.headers))
        return [response.status, response.body]
      })
      .post(/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .post(uri)
          .set(copyHeaders(this.req.headers))
          .send(body)
        return [response.status, response.body]
      })
      .delete(/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .delete(uri)
          .set(copyHeaders(this.req.headers))
          .send(body)
        return [response.status, response.body]
      })
  }

  private mockAuthHost() {
    const app = this.app

    this._nockScopes.auth = nock(this.options.authHost)
      .persist()
      .post(/^\/oauth\/.*/)
      .reply(async function(uri, body) {
        const response = await supertest(app)
          .post(uri + '?' + body)
          .set(copyHeaders(this.req.headers))
          .send()
        return [response.status, response.body]
      })
  }
}
