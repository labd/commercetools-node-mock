import { Router } from 'express'
import { ProductTypeRepository } from '../repositories/product-type.js'
import AbstractService from './abstract.js'

export class ProductTypeService extends AbstractService {
  public repository: ProductTypeRepository

  constructor(parent: Router, repository: ProductTypeRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'product-types'
  }
}
