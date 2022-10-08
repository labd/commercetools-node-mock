import { Router } from 'express'
import AbstractService from './abstract'
import { DiscountCodeRepository } from '../repositories/discount-code'

export class DiscountCodeService extends AbstractService {
  public repository: DiscountCodeRepository

  constructor(parent: Router, repository: DiscountCodeRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'discount-codes'
  }
}
