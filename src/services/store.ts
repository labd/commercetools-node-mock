import AbstractService from './abstract'
import { Router, Request, Response } from 'express'
import { StoreRepository } from '../repositories/store'
import { getRepositoryContext } from '../repositories/helpers'

export class StoreService extends AbstractService {
  public repository: StoreRepository

  constructor(parent: Router, repository: StoreRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'stores'
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
