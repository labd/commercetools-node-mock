import { ProductTypeRepository } from '../repositories/product-type'
import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { AbstractStorage } from '../storage'
import { getRepositoryContext } from 'repositories/helpers'

export class ProductTypeService extends AbstractService {
  public repository: ProductTypeRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ProductTypeRepository(storage)
  }

  getBasePath() {
    return 'product-types'
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
