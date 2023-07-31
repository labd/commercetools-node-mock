import { Router } from 'express'
import { CartDiscountRepository } from '../repositories/cart-discount.js'
import AbstractService from './abstract.js'

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
