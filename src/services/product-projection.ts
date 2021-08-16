import { ProductProjectionRepository } from './../repositories/product-projection'
import AbstractService from './abstract'
import { AbstractStorage } from '../storage'
import { Request, Response, Router } from 'express'

export class ProductProjectionService extends AbstractService {
  public repository: ProductProjectionRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ProductProjectionRepository(storage)
  }

  getBasePath() {
    return 'product-projections'
  }

  extraRoutes(router: Router) {
    router.get('/search', this.search.bind(this))
  }

  search(request: Request, response: Response) {
    const resource = this.repository.search(
      request.params.projectKey,
      request.query
    )
    return response.status(200).send(resource)
  }
}
