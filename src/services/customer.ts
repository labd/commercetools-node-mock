import AbstractService from './abstract';
import { Request, Response, Router } from 'express';
import { CustomerDraft } from '@commercetools/platform-sdk';
import { CustomerRepository } from '../repositories/customer';
import { AbstractStorage } from '../storage';

export class CustomerService extends AbstractService {
  public repository: CustomerRepository;

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent);
    this.repository = new CustomerRepository(storage);
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
