import AbstractService from './abstract'
import { Router } from 'express'
import { CustomerGroupRepository } from '../repositories/customer-group'
import { AbstractStorage } from '../storage'

export class CustomerGroupService extends AbstractService {
  public repository: CustomerGroupRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CustomerGroupRepository(storage)
  }

  getBasePath() {
    return 'customer-groups'
  }
}
