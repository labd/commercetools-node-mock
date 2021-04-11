import AbstractService from './abstract'
import { Router } from 'express'
import { CustomerRepository } from '../repositories/customer'
import { AbstractStorage } from '../storage'

export class CustomerService extends AbstractService {
  public repository: CustomerRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CustomerRepository(storage)
  }

  getBasePath() {
    return 'customers'
  }
}
