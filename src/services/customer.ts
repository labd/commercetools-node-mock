import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers'
import { CustomerRepository } from '../repositories/customer'
import { getRepositoryContext } from '../repositories/helpers'
import AbstractService from './abstract'

export class CustomerService extends AbstractService {
  public repository: CustomerRepository

  constructor(parent: Router, repository: CustomerRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'customers'
  }

  extraRoutes(parent: Router) {
    parent.post('/password-token', (request, response) => {
      const customer = this.repository.query(getRepositoryContext(request), {
        where: [`email="${request.body.email}"`],
      })
      // @ts-ignore
      const ttlMinutes: number = request.params.ttlMinutes
        ? // @ts-ignore
          +request.params.ttlMinutes
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
