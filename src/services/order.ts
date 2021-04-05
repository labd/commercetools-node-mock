import AbstractService from './abstract';
import { Request, Response, Router } from 'express';
import { OrderRepository } from '../repositories/order';
import { AbstractStorage } from '../storage';

export class OrderService extends AbstractService {
  public repository: OrderRepository;

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent);
    this.repository = new OrderRepository(storage);
  }

  getBasePath() {
    return 'orders';
  }

  extraRoutes(router: Router) {
    router.post('/import', this.import.bind(this));
    router.get(
      '/order-number=:orderNumber',
      this.getWithOrderNumber.bind(this)
    );
  }

  import(request: Request, response: Response) {
    const importDraft = request.body;
    const resource = this.repository.import(importDraft);
    return response.status(200).send(resource);
  }

  getWithOrderNumber(request: Request, response: Response) {
    const resource = this.repository.getWithOrderNumber(
      request.params.orderNumber
    );
    if (resource) {
      return response.status(200).send(resource);
    }
    return response.status(404).send('Not found');
  }
}
