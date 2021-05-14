import { ShippingMethodRepository } from '../repositories/shipping-method'
import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { AbstractStorage } from '../storage'

export class ShippingMethodService extends AbstractService {
  public repository: ShippingMethodRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ShippingMethodRepository(storage)
  }

  getBasePath() {
    return 'shipping-methods'
  }

  extraRoutes(router: Router) {
    router.get('/matching-cart', this.matchingCart.bind(this))
  }

  matchingCart(request: Request, response: Response) {
    const resources = this.repository.all(request.params.projectKey)
    if (resources) {
      return response.status(200).send({ results: resources })
    }
    return response.status(404).send('Not found')
  }
}
