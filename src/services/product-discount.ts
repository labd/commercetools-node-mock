import { Router } from 'express'
import { ProductDiscountRepository } from '../repositories/product-discount.js'
import AbstractService from './abstract.js'

export class ProductDiscountService extends AbstractService {
	public repository: ProductDiscountRepository

	constructor(parent: Router, repository: ProductDiscountRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'product-discounts'
	}
}
