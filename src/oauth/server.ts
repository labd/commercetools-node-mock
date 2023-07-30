import auth from 'basic-auth'
import bodyParser from 'body-parser'
import express, { NextFunction, Request, Response } from 'express'
import {
  InvalidTokenError,
} from '@commercetools/platform-sdk'
import { CommercetoolsError, InvalidRequestError } from '../exceptions'
import { InvalidClientError, UnsupportedGrantType } from './errors'
import { OAuth2Store } from './store'
import { getBearerToken } from './helpers'

export class OAuth2Server {
  store: OAuth2Store

  constructor(options: { enabled: boolean; validate: boolean }) {
    this.store = new OAuth2Store(options.validate)
  }

  createRouter() {
    const router = express.Router()
    router.use(bodyParser.urlencoded({ extended: true }))
    router.post('/token', this.tokenHandler.bind(this))
    return router
  }

  createMiddleware() {
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
  async tokenHandler(request: Request, response: Response, next: NextFunction) {
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
        credentials.name,
        credentials.pass,
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
}
