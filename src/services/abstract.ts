import type { Update } from '@commercetools/platform-sdk'
import { type Request, type Response, Router } from 'express'
import { ParsedQs } from 'qs'
import { AbstractResourceRepository } from '../repositories/abstract.js'
import { getRepositoryContext } from '../repositories/helpers.js'

export default abstract class AbstractService {
	protected abstract getBasePath(): string
	public abstract repository: AbstractResourceRepository<any>

	createStatusCode = 201

	constructor(parent: Router) {
		this.registerRoutes(parent)
	}

	extraRoutes(router: Router) {}

	registerRoutes(parent: Router) {
		const basePath = this.getBasePath()
		const router = Router({ mergeParams: true })

		// Bind this first since the `/:id` routes are currently a bit to greedy
		this.extraRoutes(router)

		router.get('/', this.get.bind(this))
		router.get('/key=:key', this.getWithKey.bind(this)) // same thing goes for the key routes
		router.get('/:id', this.getWithId.bind(this))

		router.delete('/key=:key', this.deleteWithKey.bind(this))
		router.delete('/:id', this.deleteWithId.bind(this))

		router.post('/', this.post.bind(this))
		router.post('/key=:key', this.postWithKey.bind(this))
		router.post('/:id', this.postWithId.bind(this))

		parent.use(`/${basePath}`, router)
	}

	get(request: Request, response: Response) {
		const limit = this._parseParam(request.query.limit)
		const offset = this._parseParam(request.query.offset)

		const result = this.repository.query(getRepositoryContext(request), {
			expand: this._parseParam(request.query.expand),
			where: this._parseParam(request.query.where),
			limit: limit !== undefined ? Number(limit) : undefined,
			offset: offset !== undefined ? Number(offset) : undefined,
		})
		return response.status(200).send(result)
	}

	getWithId(request: Request, response: Response) {
		const result = this._expandWithId(request, request.params['id'])
		if (!result) {
			return response.status(404).send()
		}
		return response.status(200).send(result)
	}

	getWithKey(request: Request, response: Response) {
		const result = this.repository.getByKey(
			getRepositoryContext(request),
			request.params['key'],
			{ expand: this._parseParam(request.query.expand) }
		)
		if (!result) return response.status(404).send()
		return response.status(200).send(result)
	}

	deleteWithId(request: Request, response: Response) {
		const result = this.repository.delete(
			getRepositoryContext(request),
			request.params['id'],
			{
				expand: this._parseParam(request.query.expand),
			}
		)
		if (!result) {
			return response.status(404).send('Not found')
		}
		return response.status(200).send(result)
	}

	deleteWithKey(request: Request, response: Response) {
		const resource = this.repository.getByKey(
			getRepositoryContext(request),
			request.params['key']
		)
		if (!resource) {
			return response.status(404).send('Not found')
		}

		const result = this.repository.delete(
			getRepositoryContext(request),
			resource.id,
			{
				expand: this._parseParam(request.query.expand),
			}
		)
		if (!result) {
			return response.status(404).send('Not found')
		}
		return response.status(200).send(result)
	}

	post(request: Request, response: Response) {
		const draft = request.body
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft
		)
		const result = this._expandWithId(request, resource.id)
		return response.status(this.createStatusCode).send(result)
	}

	postWithId(request: Request, response: Response) {
		const updateRequest: Update = request.body
		const resource = this.repository.get(
			getRepositoryContext(request),
			request.params['id']
		)
		if (!resource) {
			return response.status(404).send('Not found')
		}

		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions
		)

		const result = this._expandWithId(request, updatedResource.id)
		return response.status(200).send(result)
	}

	postWithKey(request: Request, response: Response) {
		const updateRequest: Update = request.body
		const resource = this.repository.getByKey(
			getRepositoryContext(request),
			request.params['key']
		)
		if (!resource) {
			return response.status(404).send('Not found')
		}
		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions
		)

		const result = this._expandWithId(request, updatedResource.id)
		return response.status(200).send(result)
	}

	protected _expandWithId(request: Request, resourceId: string) {
		const result = this.repository.get(
			getRepositoryContext(request),
			resourceId,
			{
				expand: this._parseParam(request.query.expand),
			}
		)
		return result
	}

	// No idea what i'm doing
	protected _parseParam(
		value: string | ParsedQs | string[] | ParsedQs[] | undefined
	): string[] | undefined {
		if (Array.isArray(value)) {
			// @ts-ignore
			return value
		} else if (value !== undefined) {
			return [`${value}`]
		}
		return undefined
	}
}
