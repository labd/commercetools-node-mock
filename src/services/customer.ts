import { type Request, type Response, Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers.js'
import { CustomerRepository } from '../repositories/customer.js'
import { getRepositoryContext } from '../repositories/helpers.js'
import AbstractService from './abstract.js'
import { CustomerSignInResult } from '@commercetools/platform-sdk'

export class CustomerService extends AbstractService {
	public repository: CustomerRepository

	constructor(parent: Router, repository: CustomerRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'customers'
	}

	post(request: Request, response: Response) {
		const draft = request.body
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft
		)
		const expanded = this._expandWithId(request, resource.id)

		const result: CustomerSignInResult = {
			customer: expanded,
		}
		return response.status(this.createStatusCode).send(result)
	}

	extraRoutes(parent: Router) {
		parent.post('/password-token', (request, response) => {
			const customer = this.repository.query(getRepositoryContext(request), {
				where: [`email="${request.body.email}"`],
			})
			// @ts-ignore
			const ttlMinutes: number = request.params.ttlMinutes
				? // @ts-ignore
					+request.params.ttlMinutes
				: 34560
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { version, ...rest } = getBaseResourceProperties()

			return response.status(200).send({
				...rest,
				customerId: customer.results[0].id,
				expiresAt: new Date(Date.now() + ttlMinutes * 60).toISOString(),
				value: uuidv4(),
			})
		})
	}
}
