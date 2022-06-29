import { ProductDiscountRepository } from '../repositories/product-discount'
import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { AbstractStorage } from '../storage'
import { getRepositoryContext } from '../repositories/helpers'

export class ProductDiscountService extends AbstractService {
  public repository: ProductDiscountRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ProductDiscountRepository(storage)
  }

  getBasePath() {
    return 'product-discounts'
  }

  extraRoutes(router: Router) {
    router.get('/key=:key', this.getWithKey.bind(this))
  }

  getWithKey(request: Request, response: Response) {
    const resource = this.repository.getWithKey(
      getRepositoryContext(request),
      request.params.key
    )
    if (resource) {
      return response.status(200).send(resource)
    }
    return response.status(404).send('Not found')
  }
}
