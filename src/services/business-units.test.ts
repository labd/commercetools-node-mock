import { BusinessUnit } from '@commercetools/platform-sdk'
import assert from 'assert'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import supertest from 'supertest'
import { CommercetoolsMock } from '../ctMock.js'

describe('Business units query', () => {
	const ctMock = new CommercetoolsMock()
	let businessUnit: BusinessUnit | undefined

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post('/dummy/business-units')
			.send({
				key: 'example-business-unit',
				status: 'Active',
				name: 'Example Business Unit',
				unitType: 'Company',
			})

		assert(response.status === 201)


		businessUnit = response.body as BusinessUnit
	})

	afterEach(() => {
		ctMock.clear()
	})

	test('no filter', async () => {
		const response = await supertest(ctMock.app)
			.get('/dummy/business-units')
			.query('{}')
			.send()

		expect(response.status).toBe(200)
		expect(response.body.count).toBe(1)

		const businessUnit = response.body.results[0] as BusinessUnit

		expect(businessUnit.key).toBe('example-business-unit')
	})
})
