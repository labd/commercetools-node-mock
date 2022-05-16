import AbstractService from './abstract'
import { Router, Request, Response } from 'express'
import { StoreRepository } from '../repositories/store'
import { AbstractStorage } from '../storage'

export class StoreService extends AbstractService {
  public repository: StoreRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new StoreRepository(storage)
  }

  getBasePath() {
    return 'stores'
  }

    extraRoutes(router: Router) {
    router.get('/key=:key', this.getWithKey.bind(this))
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
