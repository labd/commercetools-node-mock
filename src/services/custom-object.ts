import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { CustomObjectRepository } from '../repositories/custom-object'
import { AbstractStorage } from '../storage'

export class CustomObjectService extends AbstractService {
  public repository: CustomObjectRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CustomObjectRepository(storage)
  }

  getBasePath() {
    return 'custom-objects'
  }

  extraRoutes(router: Router) {
    router.get('/:container/:key', this.getWithContainerAndKey.bind(this))
  }

  getWithContainerAndKey(request: Request, response: Response) {
    const result = this.repository.getWithContainerAndKey(
      request.params.projectKey,
      request.params.container,
      request.params.key
    )

    if (!result) {
      return response.status(404).send('Not Found')
    }
    return response.status(200).send(result)
  }
}
