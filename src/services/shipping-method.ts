import { Router } from 'express'
import { ShippingMethodRepository } from '../repositories/shipping-method'
import AbstractService from './abstract'

export class ShippingMethodService extends AbstractService {
  public repository: ShippingMethodRepository

  constructor(parent: Router, repository: ShippingMethodRepository) {
    super(parent)
    this.repository = repository
    this.registerRoutes(parent)
  }

  getBasePath() {
    return 'shipping-methods'
  }

  extraRoutes(parent: Router) {
    parent.get('/matching-cart', this.get.bind(this))
  }
}
