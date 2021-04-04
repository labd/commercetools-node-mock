import AbstractService from './abstract';
import { Request, Response, Router } from 'express';

export class OrderService extends AbstractService {
  getBasePath() {
    return 'orders';
  }

  extraRoutes(router: Router) {
    router.post('/import', this.import.bind(this));
  }

  import(request: Request, response: Response) {
    const draft = request.body;
    const resource = this.repository.create(draft);
    return response.status(200).send(resource);
  }
}
