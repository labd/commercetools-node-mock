import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { CategoryRepository } from '../repositories/category'

export class CategoryServices extends AbstractService {
  public repository: CategoryRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CategoryRepository(storage)
  }

  getBasePath() {
    return 'categories'
  }
}
