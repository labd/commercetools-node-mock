import { Router } from 'express'
import { DiscountCodeRepository } from '../repositories/discount-code.js'
import AbstractService from './abstract.js'

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
