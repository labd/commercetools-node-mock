import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { AbstractStorage } from '../storage'
import { CustomerRepository } from '../repositories/customer'

export class MyCustomerService extends AbstractService {
  public repository: CustomerRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CustomerRepository(storage)
  }

  getBasePath() {
    return 'me'
  }

  registerRoutes(parent: Router) {
    // Overwrite this function to be able to handle /me path.
    const basePath = this.getBasePath()
    const router = Router({ mergeParams: true })

    this.extraRoutes(router)

    router.get('', this.getMe.bind(this))

    router.post('/signup', this.signUp.bind(this))

    parent.use(`/${basePath}`, router)
  }

  getMe(request: Request, response: Response) {
    const resource = this.repository.getMe(request.params.projectKey)
    if (!resource) {
      return response.status(404).send('Not found')
    }
    return response.status(200).send(resource)
  }

  signUp(request: Request, response: Response) {
    const draft = request.body
    const resource = this.repository.create(request.params.projectKey, draft)
    const result = this._expandWithId(request, resource.id)
    return response.status(this.createStatusCode).send({ customer: result })
  }
}
