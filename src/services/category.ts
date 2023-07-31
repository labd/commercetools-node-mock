import { Router } from 'express'
import { CategoryRepository } from '../repositories/category.js'
import AbstractService from './abstract.js'

export class CategoryServices extends AbstractService {
  public repository: CategoryRepository

  constructor(parent: Router, repository: CategoryRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'categories'
  }
}
