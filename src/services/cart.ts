import AbstractService from './abstract'
import { Router } from 'express'
import { CartRepository } from '../repositories/cart'
import { AbstractStorage } from '../storage'

export class CartService extends AbstractService {
  public repository: CartRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CartRepository(storage)
  }

  getBasePath() {
    return 'carts'
  }
}
