import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { OrderRepository } from '../repositories/order'
import { getRepositoryContext } from '../repositories/helpers'

export class OrderService extends AbstractService {
  public repository: OrderRepository

  constructor(parent: Router, repository: OrderRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'orders'
  }

  extraRoutes(router: Router) {
    router.post('/import', this.import.bind(this))
    router.get('/order-number=:orderNumber', this.getWithOrderNumber.bind(this))
  }

  import(request: Request, response: Response) {
    const importDraft = request.body
    const resource = this.repository.import(
      getRepositoryContext(request),
      importDraft
    )
    return response.status(200).send(resource)
  }

  getWithOrderNumber(request: Request, response: Response) {
    const resource = this.repository.getWithOrderNumber(
      getRepositoryContext(request),
      request.params.orderNumber,
      request.query
    )
    if (resource) {
      return response.status(200).send(resource)
    }
    return response.status(404).send('Not found')
  }
}
