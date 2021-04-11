import { randomBytes } from 'crypto'

type Token = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  scope: string
}

export class OAuth2Store {
  tokens: Token[] = []
  validate: Boolean = true

  constructor(validate: Boolean = true) {
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

  validateToken(token: string) {
    if (!this.validate) return true

    const foundToken = this.tokens.find(t => t.access_token == token)
    if (foundToken) {
      return true
    }
    return false
  }
}
