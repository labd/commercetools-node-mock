import { TaxCategoryRepository } from '../repositories/tax-category'
import AbstractService from './abstract'
import { Router } from 'express'

export class TaxCategoryService extends AbstractService {
  public repository: TaxCategoryRepository

  constructor(parent: Router, repository: TaxCategoryRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'tax-categories'
  }
}
