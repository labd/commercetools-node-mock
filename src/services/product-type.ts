import { Router } from 'express'
import { ProductTypeRepository } from '../repositories/product-type'
import AbstractService from './abstract'

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
