import type { ProductTypeDraft } from '@commercetools/platform-sdk'
import { describe, expect, test } from 'bun:test'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index.js'

const ctMock = new CommercetoolsMock()

describe('Product type', () => {
	test('Create product type', async () => {
		const draft: ProductTypeDraft = {
			name: 'foo',
			description: 'bar',
			attributes: [
				{
					name: 'name',
					type: { name: 'boolean' },
					label: { 'nl-NL': 'bar' },
					isRequired: false,
				},
			],
		}
		const response = await supertest(ctMock.app)
			.post('/dummy/product-types')
			.send(draft)

		expect(response.status).toBe(201)

		expect(response.body).toEqual({
			attributes: [
				{
					attributeConstraint: 'None',
					inputHint: 'SingleLine',
					isRequired: false,
					isSearchable: true,
					label: {
						'nl-NL': 'bar',
					},
					name: 'name',
					type: {
						name: 'boolean',
					},
				},
			],
			createdAt: expect.anything(),
			description: 'bar',
			id: expect.anything(),
			lastModifiedAt: expect.anything(),
			name: 'foo',
			version: 1,
		})
	})

	test('Get product type', async () => {
		const draft: ProductTypeDraft = {
			name: 'foo',
			description: 'bar',
		}
		const createResponse = await supertest(ctMock.app)
			.post('/dummy/product-types')
			.send(draft)

		expect(createResponse.status).toBe(201)

		const response = await supertest(ctMock.app).get(
			`/dummy/product-types/${createResponse.body.id}`
		)

		expect(response.status).toBe(200)
		expect(response.body).toEqual(createResponse.body)
	})
})
