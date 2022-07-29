import AbstractService, { ValidationSchemas } from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { ProductRepository } from '../repositories/product'
import { ProductDraftSchema, ProductUpdateSchema } from '../validate'

export class ProductService extends AbstractService {
  public repository: ProductRepository
  validationSchemas: ValidationSchemas = {
    update: ProductUpdateSchema,
    create: ProductDraftSchema,
  }

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ProductRepository(storage)
  }

  getBasePath() {
    return 'products'
  }
}
