import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { OrderRepository } from '../repositories/order'
import { AbstractStorage } from '../storage'
import { OrderImportDraftSchema } from '../validate'
import { CommercetoolsError } from 'exceptions'
import { InvalidInputError } from '@commercetools/platform-sdk'

export class OrderService extends AbstractService {
  public repository: OrderRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new OrderRepository(storage)
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
    if (!OrderImportDraftSchema(importDraft)) {
      // @ts-ignore
      const errors = OrderImportDraftSchema.errors
      throw new CommercetoolsError<InvalidInputError>(errors)
    }

    const resource = this.repository.import(
      request.params.projectKey,
      importDraft
    )
    return response.status(200).send(resource)
  }

  getWithOrderNumber(request: Request, response: Response) {
    const resource = this.repository.getWithOrderNumber(
      request.params.projectKey,
      request.params.orderNumber,
      request.query
    )
    if (resource) {
      return response.status(200).send(resource)
    }
    return response.status(404).send('Not found')
  }
}
