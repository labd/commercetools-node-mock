import { Router } from 'express'
import AbstractService from './abstract'
import { AbstractStorage } from '../storage'
import { CartDiscountRepository } from '../repositories/cart-discount'

export class CartDiscountService extends AbstractService {
  public repository: CartDiscountRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CartDiscountRepository(storage)
  }

  getBasePath() {
    return 'cart-discounts'
  }
}
