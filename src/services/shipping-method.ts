import { ShippingMethodRepository } from '../repositories/shipping-method'
import AbstractService from './abstract'
import { AbstractStorage } from '../storage'
import { Router } from 'express'

export class ShippingMethodService extends AbstractService {
  public repository: ShippingMethodRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ShippingMethodRepository(storage)
    this.registerRoutes(parent)
  }

  getBasePath() {
    return 'shipping-methods'
  }

  extraRoutes(parent: Router) {
    parent.get('/matching-cart', this.get.bind(this))
  }
}
