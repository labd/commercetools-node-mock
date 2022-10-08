import AbstractService from './abstract'
import { Router } from 'express'
import { CustomerGroupRepository } from '../repositories/customer-group'

export class CustomerGroupService extends AbstractService {
  public repository: CustomerGroupRepository

  constructor(parent: Router, repository: CustomerGroupRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'customer-groups'
  }
}
