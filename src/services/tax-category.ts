import { Router } from 'express'
import { TaxCategoryRepository } from '../repositories/tax-category.js'
import AbstractService from './abstract.js'

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
