import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { PaymentRepository } from 'repositories/payment'

export class PaymentService extends AbstractService {
  public repository: PaymentRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new PaymentRepository(storage)
  }

  getBasePath() {
    return 'payments'
  }
}
