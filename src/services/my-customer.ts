import { Request, Response, Router } from 'express'
import { CustomerRepository } from '../repositories/customer.js'
import { getRepositoryContext } from '../repositories/helpers.js'
import AbstractService from './abstract.js'
import { hashPassword } from '../lib/password.js'
import { Update } from '@commercetools/platform-sdk'

export class MyCustomerService extends AbstractService {
	public repository: CustomerRepository

	constructor(parent: Router, repository: CustomerRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'me'
	}

	registerRoutes(parent: Router) {
		// Overwrite this function to be able to handle /me path.
		const basePath = this.getBasePath()
		const router = Router({ mergeParams: true })

		this.extraRoutes(router)

		router.get('', this.getMe.bind(this))
		router.post('', this.updateMe.bind(this))

		router.post('/signup', this.signUp.bind(this))

		router.post('/login', this.signIn.bind(this))

		parent.use(`/${basePath}`, router)
	}

	getMe(request: Request, response: Response) {
		const resource = this.repository.getMe(getRepositoryContext(request))
		if (!resource) {
			return response.status(404).send('Not found')
		}
		return response.status(200).send(resource)
	}

	updateMe(request: Request, response: Response) {
		const resource = this.repository.getMe(getRepositoryContext(request))

		if (!resource) {
			return response.status(404).send('Not found')
		}
		const updateRequest: Update = request.body
		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions
		)

		const result = this._expandWithId(request, updatedResource.id)
		return response.status(200).send(result)
	}

	signUp(request: Request, response: Response) {
		const draft = request.body
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft
		)
		const result = this._expandWithId(request, resource.id)
		return response.status(this.createStatusCode).send({ customer: result })
	}

	signIn(request: Request, response: Response) {
		const { email, password } = request.body
		const encodedPassword = hashPassword(password)

		const result = this.repository.query(getRepositoryContext(request), {
			where: [`email = "${email}"`, `password = "${encodedPassword}"`],
		})

		if (result.count === 0) {
			return response.status(400).send({
				message: 'Account with the given credentials not found.',
				errors: [
					{
						code: 'InvalidCredentials',
						message: 'Account with the given credentials not found.',
					},
				],
			})
		}

		return response.status(200).send({ customer: result.results[0] })
	}
}
