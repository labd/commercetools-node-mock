import AbstractService from './abstract';
import { Request, Response, Router } from 'express';
import { TypeDraft } from '@commercetools/platform-sdk';
import { TypeRepository } from '../repositories/type';
import { AbstractStorage } from '../storage';

export class TypeService extends AbstractService {
  public repository: TypeRepository;

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent);
    this.repository = new TypeRepository(storage);
  }

  getBasePath() {
    return 'types';
  }

  post(request: Request, response: Response) {
    const draft: TypeDraft = request.body;
    const resource = this.repository.create(draft);
    return response.status(200).send(resource);
  }
}
