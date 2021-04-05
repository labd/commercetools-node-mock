import AbstractService from './abstract';
import { Request, Response, Router } from 'express';
import { CustomObjectDraft } from '@commercetools/platform-sdk';
import { CustomObjectRepository } from '../repositories/custom-object';
import { AbstractStorage } from '../storage';

export class CustomObjectService extends AbstractService {
  public repository: CustomObjectRepository;

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent);
    this.repository = new CustomObjectRepository(storage);
  }

  getBasePath() {
    return 'custom-objects';
  }

  extraRoutes(router: Router) {
    router.get('/:container/:key', this.getWithContainerAndKey.bind(this));
  }

  getWithContainerAndKey(request: Request, response: Response) {
    const result = this.repository.getWithContainerAndKeygetBy(
      request.params.container,
      request.params.key
    );
    if (!result) {
      return response.status(404).send('Not Found');
    }
    return response.status(200).send(result);
  }

  post(request: Request, response: Response) {
    const draft: CustomObjectDraft = request.body;
    const resource = this.repository.create(draft);
    return response.status(200).send(resource);
  }
}
