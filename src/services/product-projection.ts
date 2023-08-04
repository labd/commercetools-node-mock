import { Request, Response, Router } from 'express'
import { getRepositoryContext } from '../repositories/helpers.js'
import { ProductProjectionRepository } from './../repositories/product-projection.js'
import AbstractService from './abstract.js'

export class ProductProjectionService extends AbstractService {
	public repository: ProductProjectionRepository

	constructor(parent: Router, repository: ProductProjectionRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'product-projections'
	}

	extraRoutes(router: Router) {
		router.get('/search', this.search.bind(this))
	}

	get(request: Request, response: Response) {
		const limit = this._parseParam(request.query.limit)
		const offset = this._parseParam(request.query.offset)

		const result = this.repository.query(getRepositoryContext(request), {
			...request.query,
			expand: this._parseParam(request.query.expand),
			where: this._parseParam(request.query.where),
			limit: limit !== undefined ? Number(limit) : undefined,
			offset: offset !== undefined ? Number(offset) : undefined,
		})
		return response.status(200).send(result)
	}

	search(request: Request, response: Response) {
		const resource = this.repository.search(
			getRepositoryContext(request),
			request.query
		)
		return response.status(200).send(resource)
	}
}
