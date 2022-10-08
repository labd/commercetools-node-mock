import AbstractService from './abstract'
import { Router } from 'express'
import { CategoryRepository } from '../repositories/category'

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
