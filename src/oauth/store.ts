import { randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'

type Token = {
	access_token: string
	token_type: 'Bearer'
	expires_in: number
	scope: string
}

export class OAuth2Store {
	tokens: Token[] = []
	validate = true

	constructor(validate = true) {
		this.validate = validate
	}

	getClientToken(clientId: string, clientSecret: string, scope?: string) {
		const token: Token = {
			access_token: randomBytes(16).toString('base64'),
			token_type: 'Bearer',
			expires_in: 172800,
			scope: scope || 'todo',
		}
		this.tokens.push(token)
		return token
	}

	getAnonymousToken(scope: string, anonymousId: string | undefined) {
		if (!anonymousId) {
			anonymousId = uuidv4()
		}
		const token: Token = {
			access_token: randomBytes(16).toString('base64'),
			token_type: 'Bearer',
			expires_in: 172800,
			scope: scope
				? `${scope} anonymous_id:${anonymousId}`
				: `anonymous_id:${anonymousId}`,
		}
		this.tokens.push(token)
		return token
	}

	getCustomerToken(scope: string, customerId: string) {
		const token: Token = {
			access_token: randomBytes(16).toString('base64'),
			token_type: 'Bearer',
			expires_in: 172800,
			scope: scope
				? `${scope} customer_id:${customerId}`
				: `customer_id:${customerId}`,
		}
		this.tokens.push(token)
		return token
	}

	validateToken(token: string) {
		if (!this.validate) return true

		const foundToken = this.tokens.find((t) => t.access_token === token)
		if (foundToken) {
			return true
		}
		return false
	}
}
