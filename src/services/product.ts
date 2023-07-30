import { Router } from 'express'
import { ProductRepository } from '../repositories/product.js'
import AbstractService from './abstract.js'

export class ProductService extends AbstractService {
  public repository: ProductRepository

  constructor(parent: Router, repository: ProductRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'products'
  }
}
