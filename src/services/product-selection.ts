import { Router } from 'express'
import AbstractService from './abstract.js'
import { ProductSelectionRepository } from '../repositories/product-selection.js'

export class ProductSelectionService extends AbstractService {
	public repository: ProductSelectionRepository

	constructor(parent: Router, repository: ProductSelectionRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'product-selections'
	}
}
