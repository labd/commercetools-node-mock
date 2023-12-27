import { Request, Response, Router } from 'express'
import { ShippingMethodRepository } from '../repositories/shipping-method.js'
import AbstractService from './abstract.js'
import { getRepositoryContext } from '../repositories/helpers.js'
import { queryParamsValue } from '../helpers.js'

export class ShippingMethodService extends AbstractService {
	public repository: ShippingMethodRepository

	constructor(parent: Router, repository: ShippingMethodRepository) {
		super(parent)
		this.repository = repository
		this.registerRoutes(parent)
	}

	getBasePath() {
		return 'shipping-methods'
	}

	extraRoutes(parent: Router) {
		parent.get('/matching-cart', this.matchingCart.bind(this))
	}

	matchingCart(request: Request, response: Response) {
		const cartId = queryParamsValue(request.query.cartId)
		if (!cartId) {
			return response.status(400).send()
		}
		const result = this.repository.matchingCart(
			getRepositoryContext(request),
			cartId,
			{
				expand: this._parseParam(request.query.expand),
			}
		)
		return response.status(200).send(result)
	}
}
