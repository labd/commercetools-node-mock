import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { ProductRepository } from '../repositories/product'

export class ProductService extends AbstractService {
  public repository: ProductRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ProductRepository(storage)
  }

  getBasePath() {
    return 'products'
  }
}
