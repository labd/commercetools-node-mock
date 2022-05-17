import AbstractService from './abstract'
import { Router } from 'express'
import { CustomerRepository } from '../repositories/customer'
import { AbstractStorage } from '../storage'
import { getBaseResourceProperties } from '../helpers'
import { v4 as uuidv4 } from 'uuid'

export class CustomerService extends AbstractService {
  public repository: CustomerRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CustomerRepository(storage)
  }

  getBasePath() {
    return 'customers'
  }

  extraRoutes(parent: Router) {
    parent.post('/password-token', (request, response) => {
      const customer = this.repository.query(request.params.projectKey, {
        where: [`email="${request.body.email}"`],
      })
      const ttlMinutes: number = request.params.ttlMinutes
        ? +request.params.ttlMinutes
        : 34560
      const { version, ...rest } = getBaseResourceProperties()

      return response.status(200).send({
        ...rest,
        customerId: customer.results[0].id,
        expiresAt: new Date(Date.now() + ttlMinutes * 60).toISOString(),
        value: uuidv4(),
      })
    })
  }
}
