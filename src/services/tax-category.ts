import { TaxCategoryRepository } from '../repositories/tax-category'
import AbstractService from './abstract'
import { AbstractStorage } from '../storage'
import { Request, Response, Router } from 'express'

export class TaxCategoryService extends AbstractService {
  public repository: TaxCategoryRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new TaxCategoryRepository(storage)
  }

  getBasePath() {
    return 'tax-categories'
  }

  extraRoutes(router: Router) {
    router.get('/order-number=:orderNumber', this.getWithKey.bind(this))
  }

  getWithKey(request: Request, response: Response) {
    const resource = this.repository.getWithKey(
      request.params.projectKey,
      request.params.key
    )
    if (resource) {
      return response.status(200).send(resource)
    }
    return response.status(404).send('Not found')
  }
}
