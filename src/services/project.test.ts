import type { Project } from '@commercetools/platform-sdk'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index.js'

const ctMock = new CommercetoolsMock()

describe('Project', () => {
	beforeAll(() => {
		ctMock.start()
	})

	afterEach(() => {
		ctMock.clear()
	})

	afterAll(() => {
		ctMock.stop()
	})

	test('Get project by key', async () => {
		const response = await supertest(ctMock.app).get('/dummy/')

		expect(response.status).toBe(200)
		expect(response.body).toEqual({
			version: 1,
			carts: {
				countryTaxRateFallbackEnabled: false,
				deleteDaysAfterLastModification: 90,
			},
			countries: [],
			createdAt: '2018-10-04T11:32:12.603Z',
			currencies: [],
			key: 'dummy',
			languages: [],
			messages: {
				deleteDaysAfterCreation: 15,
				enabled: false,
			},
			name: '',
			searchIndexing: {
				orders: {
					status: 'Deactivated',
				},
				products: {
					status: 'Deactivated',
				},
			},
			trialUntil: '2018-12',
		} as Project)
	})
})
