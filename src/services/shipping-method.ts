import { ShippingMethodRepository } from '../repositories/shipping-method'
import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'

export class ShippingMethodService extends AbstractService {
  public repository: ShippingMethodRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ShippingMethodRepository(storage)
  }

  getBasePath() {
    return 'shipping-methods'
  }
}
