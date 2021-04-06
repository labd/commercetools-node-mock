import AbstractService from './abstract';
import { Request, Response, Router } from 'express';
import { StoreDraft } from '@commercetools/platform-sdk';
import { StoreRepository } from '../repositories/store';
import { AbstractStorage } from '../storage';

export class StoreService extends AbstractService {
  public repository: StoreRepository;

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent);
    this.repository = new StoreRepository(storage);
  }

  getBasePath() {
    return 'stores';
  }

  post(request: Request, response: Response) {
    const draft: StoreDraft = request.body;
    const resource = this.repository.create(draft);
    return response.status(200).send(resource);
  }
}
