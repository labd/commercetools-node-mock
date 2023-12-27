import auth from 'basic-auth'
import bodyParser from 'body-parser'
import express, {
	type NextFunction,
	type Request,
	type Response,
} from 'express'
import { InvalidTokenError } from '@commercetools/platform-sdk'
import { CommercetoolsError, InvalidRequestError } from '../exceptions.js'
import { InvalidClientError, UnsupportedGrantType } from './errors.js'
import { OAuth2Store } from './store.js'
import { getBearerToken } from './helpers.js'
import { CustomerRepository } from '../repositories/customer.js'
import { hashPassword } from '../lib/password.js'

type AuthRequest = Request & {
	credentials: {
		clientId: string
		clientSecret: string
	}
}

export class OAuth2Server {
	store: OAuth2Store
	private customerRepository: CustomerRepository

	constructor(private options: { enabled: boolean; validate: boolean }) {
		this.store = new OAuth2Store(options.validate)
	}

	setCustomerRepository(repository: CustomerRepository) {
		this.customerRepository = repository
	}

	createRouter() {
		const router = express.Router()
		router.use(bodyParser.urlencoded({ extended: true }))
		router.use(this.validateClientCredentials.bind(this))
		router.post('/token', this.tokenHandler.bind(this))
		router.post(
			'/:projectKey/customers/token',
			this.customerTokenHandler.bind(this)
		)
		router.post(
			'/:projectKey/in-store/key=:storeKey/customers/token',
			this.inStoreCustomerTokenHandler.bind(this)
		)
		router.post(
			'/:projectKey/anonymous/token',
			this.anonymousTokenHandler.bind(this)
		)
		return router
	}

	createMiddleware() {
		if (!this.options.validate) {
			return async (request: Request, response: Response, next: NextFunction) => {
				next()
			}
		}

		return async (request: Request, response: Response, next: NextFunction) => {
			const token = getBearerToken(request)
			if (!token) {
				next(
					new CommercetoolsError<InvalidTokenError>(
						{
							code: 'invalid_token',
							message:
								'This endpoint requires an access token. You can get one from the authorization server.',
						},
						401
					)
				)
			}

			if (!token || !this.store.validateToken(token)) {
				next(
					new CommercetoolsError<InvalidTokenError>(
						{
							code: 'invalid_token',
							message: 'invalid_token',
						},
						401
					)
				)
			}

			next()
		}
	}

	async validateClientCredentials(
		request: AuthRequest,
		response: Response,
		next: NextFunction
	) {
		const authHeader = request.header('Authorization')
		if (!authHeader) {
			return next(
				new CommercetoolsError<InvalidClientError>(
					{
						code: 'invalid_client',
						message:
							'Please provide valid client credentials using HTTP Basic Authentication.',
					},
					401
				)
			)
		}
		const credentials = auth.parse(authHeader)
		if (!credentials) {
			return next(
				new CommercetoolsError<InvalidClientError>(
					{
						code: 'invalid_client',
						message:
							'Please provide valid client credentials using HTTP Basic Authentication.',
					},
					400
				)
			)
		}

		request.credentials = {
			clientId: credentials.name,
			clientSecret: credentials.pass,
		}

		next()
	}

	async tokenHandler(
		request: AuthRequest,
		response: Response,
		next: NextFunction
	) {
		const grantType = request.query.grant_type || request.body.grant_type
		if (!grantType) {
			return next(
				new CommercetoolsError<InvalidRequestError>(
					{
						code: 'invalid_request',
						message: 'Missing required parameter: grant_type.',
					},
					400
				)
			)
		}

		if (grantType === 'client_credentials') {
			const token = this.store.getClientToken(
				request.credentials.clientId,
				request.credentials.clientSecret,
				request.query.scope?.toString()
			)
			return response.status(200).send(token)
		} else if (grantType === 'refresh_token') {
			const token = this.store.getClientToken(
				request.credentials.clientId,
				request.credentials.clientSecret,
				request.query.scope?.toString()
			)
			return response.status(200).send(token)
		} else {
			return next(
				new CommercetoolsError<UnsupportedGrantType>(
					{
						code: 'unsupported_grant_type',
						message: `Invalid parameter: grant_type: Invalid grant type: ${grantType}`,
					},
					400
				)
			)
		}
	}
	async customerTokenHandler(
		request: AuthRequest,
		response: Response,
		next: NextFunction
	) {
		const grantType = request.query.grant_type || request.body.grant_type
		if (!grantType) {
			return next(
				new CommercetoolsError<InvalidRequestError>(
					{
						code: 'invalid_request',
						message: 'Missing required parameter: grant_type.',
					},
					400
				)
			)
		}

		if (grantType === 'password') {
			const username = request.query.username || request.body.username
			const password = hashPassword(
				request.query.password || request.body.password
			)
			const scope =
				request.query.scope?.toString() || request.body.scope?.toString()

			const result = this.customerRepository.query(
				{ projectKey: request.params.projectKey },
				{
					where: [`email = "${username}"`, `password = "${password}"`],
				}
			)

			if (result.count === 0) {
				return next(
					new CommercetoolsError<any>(
						{
							code: 'invalid_customer_account_credentials',
							message: 'Customer account with the given credentials not found.',
						},
						400
					)
				)
			}

			const customer = result.results[0]
			const token = this.store.getCustomerToken(scope, customer.id)
			return response.status(200).send(token)
		}
	}

	async inStoreCustomerTokenHandler(
		request: Request,
		response: Response,
		next: NextFunction
	) {
		return next(
			new CommercetoolsError<InvalidClientError>(
				{
					code: 'invalid_client',
					message: 'Not implemented yet in commercetools-mock',
				},
				401
			)
		)
	}

	async anonymousTokenHandler(
		request: Request,
		response: Response,
		next: NextFunction
	) {
		return next(
			new CommercetoolsError<InvalidClientError>(
				{
					code: 'invalid_client',
					message: 'Not implemented yet in commercetools-mock',
				},
				401
			)
		)
	}
}
