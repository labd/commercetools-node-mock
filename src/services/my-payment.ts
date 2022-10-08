import AbstractService from './abstract'
import { Router } from 'express'
import { PaymentRepository } from '../repositories/payment'

export class MyPaymentService extends AbstractService {
  public repository: PaymentRepository

  constructor(parent: Router, repository: PaymentRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'me/payments'
  }
}
