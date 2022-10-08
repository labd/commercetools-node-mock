import { Router } from 'express'
import AbstractService from './abstract'
import { CartDiscountRepository } from '../repositories/cart-discount'

export class CartDiscountService extends AbstractService {
  public repository: CartDiscountRepository

  constructor(parent: Router, repository: CartDiscountRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'cart-discounts'
  }
}
