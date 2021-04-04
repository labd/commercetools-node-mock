import AbstractService from './abstract';
import { Request, Response, Router } from 'express';
import { CartDraft } from '@commercetools/platform-sdk';
import { CartRepository } from '~src/repositories';

export class CartService extends AbstractService {
  protected repository: CartRepository;

  constructor(parent: Router, repository: CartRepository) {
    super(parent, repository);
    this.repository = repository;
  }

  getBasePath() {
    return 'carts';
  }

  post(request: Request, response: Response) {
    const draft: CartDraft = request.body;
    const resource = this.repository.create(draft);
    return response.status(200).send(resource);
  }
}
