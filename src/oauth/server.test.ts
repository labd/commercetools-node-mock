import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'
import { OAuth2Server } from './server'

describe('OAuth2Server', () => {
	let app: express.Express
	let server: OAuth2Server

	beforeEach(() => {
		server = new OAuth2Server({ enabled: true, validate: false })
		app = express()
		app.use(server.createRouter())
	})

	describe('POST /token', () => {
		it('should return a token for valid client credentials', async () => {
			const response = await supertest(app)
				.post('/token')
				.auth('validClientId', 'validClientSecret')
				.query({ grant_type: 'client_credentials' })
				.send()

			const body = await response.body

			expect(response.status, JSON.stringify(body)).toBe(200)
			expect(body).toHaveProperty('access_token')
		})

		it('should failed on invalid refresh token', async () => {
			const response = await supertest(app)
				.post('/token')
				.auth('validClientId', 'validClientSecret')
				.query({ grant_type: 'refresh_token', refresh_token: 'invalid' })
				.send()

			const body = await response.body

			expect(response.status, JSON.stringify(body)).toBe(400)
		})

		it('should refresh a token', async () => {
			const createResponse = await supertest(app)
				.post(`/my-project/anonymous/token`)
				.auth('validClientId', 'validClientSecret')
				.query({ grant_type: 'client_credentials' })
				.send()

			const refreshToken = createResponse.body.refresh_token

			const response = await supertest(app)
				.post('/token')
				.auth('validClientId', 'validClientSecret')
				.query({ grant_type: 'refresh_token', refresh_token: refreshToken })
				.send()

			const body = await response.body

			expect(response.status, JSON.stringify(body)).toBe(200)
			expect(body.access_token).not.toBe(createResponse.body.access_token)
			expect(body.refresh_token).toBeUndefined()
		})
	})

	describe('POST /:projectKey/anonymous/token', () => {
		it('should return a token for anonymous access', async () => {
			const projectKey = 'test-project'

			const response = await supertest(app)
				.post(`/${projectKey}/anonymous/token`)
				.auth('validClientId', 'validClientSecret')
				.query({ grant_type: 'client_credentials' })
				.send()

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('access_token')

			const matches = response.body.scope?.match(
				/(customer_id|anonymous_id):([^\s]+)/
			)
			if (matches) {
				expect(matches[1]).toBe('anonymous_id')
				expect(matches[2]).toBeDefined()
			} else {
				expect(response.body.scope).toBe('')
			}
		})
	})
})
