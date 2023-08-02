import type { CustomObjectDraft } from '@commercetools/platform-sdk'
import type { Request, Response, Router } from 'express'
import type { CustomObjectRepository } from '../repositories/custom-object.js'
import { getRepositoryContext } from '../repositories/helpers.js'
import AbstractService from './abstract.js'

export class CustomObjectService extends AbstractService {
	public repository: CustomObjectRepository

	constructor(parent: Router, repository: CustomObjectRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'custom-objects'
	}

	extraRoutes(router: Router) {
		router.get('/:container/:key', this.getWithContainerAndKey.bind(this))
		router.post('/:container/:key', this.createWithContainerAndKey.bind(this))
		router.delete('/:container/:key', this.deleteWithContainerAndKey.bind(this))
	}

	getWithContainerAndKey(request: Request, response: Response) {
		const result = this.repository.getWithContainerAndKey(
			getRepositoryContext(request),
			request.params.container,
			request.params.key
		)

		if (!result) {
			return response.status(404).send('Not Found')
		}
		return response.status(200).send(result)
	}

	createWithContainerAndKey(request: Request, response: Response) {
		const draft: CustomObjectDraft = {
			...request.body,
			key: request.params.key,
			container: request.params.container,
		}

		const result = this.repository.create(getRepositoryContext(request), draft)
		return response.status(200).send(result)
	}

	deleteWithContainerAndKey(request: Request, response: Response) {
		const current = this.repository.getWithContainerAndKey(
			getRepositoryContext(request),
			request.params.container,
			request.params.key
		)

		if (!current) {
			return response.status(404).send('Not Found')
		}

		const result = this.repository.delete(
			getRepositoryContext(request),
			current.id
		)

		return response.status(200).send(result)
	}
}
