import { ProductDiscountRepository } from '../repositories/product-discount'
import AbstractService from './abstract'
import { Router } from 'express'

export class ProductDiscountService extends AbstractService {
  public repository: ProductDiscountRepository

  constructor(parent: Router, repository: ProductDiscountRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'product-discounts'
  }
}
