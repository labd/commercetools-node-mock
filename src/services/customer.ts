import AbstractService from './abstract';
import { Request, Response, Router } from 'express';
import { CustomerDraft } from '@commercetools/platform-sdk';
import { CustomerRepository } from '~src/repositories';

export class CustomerService extends AbstractService {
  protected repository: CustomerRepository;

  constructor(parent: Router, repository: CustomerRepository) {
    super(parent, repository);
    this.repository = repository;
  }

  getBasePath() {
    return 'customers';
  }

  post(request: Request, response: Response) {
    const draft: CustomerDraft = request.body;
    const resource = this.repository.create(draft);
    return response.status(200).send(resource);
  }
}
