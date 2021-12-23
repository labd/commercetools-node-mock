
import { Router } from 'express'
import AbstractService from './abstract'
import { AbstractStorage } from '../storage'
import { DiscountCodeRepository } from '../repositories/discount-code'

export class DiscountCodeService extends AbstractService {
  public repository: DiscountCodeRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new DiscountCodeRepository(storage)
  }

  getBasePath() {
    return 'discount-codes'
  }
}
