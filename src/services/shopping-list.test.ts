import {
	Product,
	ShoppingList,
	ShoppingListDraft,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../ctMock'

const shoppingList: ShoppingList = {
	id: 'f15b4a80-7def-4381-bf6a-c66cab258a2b',
	version: 1,
	lineItems: [
		{
			addedAt: '2021-08-03T14:19:29.496Z',
			productType: { typeId: 'product-type', id: 'product-type-id' },
			id: '42ea3c57-aced-49ea-ae70-7005a47c7463',
			productId: '303bf5d8-1201-4fb9-8157-ff6efb8c04b4',
			name: {},
			quantity: 1,
			productSlug: {},
			variantId: 2,
		},
	],
	textLineItems: [],
	createdAt: '2021-07-22T12:23:33.472Z',
	lastModifiedAt: '2021-08-03T14:19:29.496Z',
	name: {},
}

export const product: Product = {
	id: '303bf5d8-1201-4fb9-8157-ff6efb8c04b4',
	createdAt: '2022-05-30T13:21:26.777Z',
	lastModifiedAt: '2022-05-30T13:21:26.777Z',
	version: 1,
	productType: {
		typeId: 'product-type',
		id: '303bf5d8-1201-4fb9-8157-ff6efb8c04b4',
	},
	masterData: {
		staged: {
			name: {},
			categories: [],
			slug: {},
			masterVariant: {
				id: 1,
				sku: '1',
			},
			variants: [],
			searchKeywords: {},
		},
		current: {
			name: {},
			slug: {},
			categories: [],
			masterVariant: {
				id: 1,
				availability: {},
			},
			variants: [
				{
					id: 2,
					sku: '22241940260',
				},
			],
			searchKeywords: {},
		},
		hasStagedChanges: true,
		published: true,
	},
}

describe('Shopping List', () => {
	const ctMock = new CommercetoolsMock({
		defaultProjectKey: 'dummy',
	})

	beforeEach(() => {
		ctMock.project().add('product', product)
		ctMock.project().add('shopping-list', shoppingList)
	})

	test('Adds variant ID on lineItems when creating', async () => {
		const draft: ShoppingListDraft = {
			name: {},
			lineItems: [{ sku: '22241940260' }],
		}
		const response = await supertest(ctMock.app)
			.post('/dummy/shopping-lists')
			.send(draft)

		expect(response.status).toBe(201)
		expect(response.body.lineItems[0].variantId).toBe(2)
	})

	test('Expands variant on lineItems', async () => {
		const response = await supertest(ctMock.app)
			.get(`/dummy/shopping-lists/${shoppingList.id}`)
			.query({ expand: 'lineItems[*].variant' })

		expect(response.status).toBe(200)
		expect(response.body.lineItems[0].variant).toEqual({
			id: 2,
			sku: '22241940260',
		})
	})
})

describe('Shopping List Update Actions', () => {
	const ctMock = new CommercetoolsMock({
		defaultProjectKey: 'dummy',
	})

	beforeEach(() => {
		ctMock.project().add('product', product)
		ctMock.project().add('shopping-list', shoppingList)
	})

	afterEach(() => {
		ctMock.clear()
	})

	test('addLineItem by productID & variantID', async () => {
		ctMock.clear()
		ctMock.project().add('product', product)
		ctMock.project().add('shopping-list', { ...shoppingList, lineItems: [] })

		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'addLineItem',
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.lineItems).toHaveLength(1)
		expect(response.body.lineItems[0].variantId).toEqual(2)
	})

	test('addLineItem by productID', async () => {
		ctMock.clear()
		ctMock.project().add('product', product)
		ctMock.project().add('shopping-list', { ...shoppingList, lineItems: [] })

		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'addLineItem',
						productId: product.id,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.lineItems).toHaveLength(1)
		expect(response.body.lineItems[0].variantId).toEqual(1)
	})

	test('addLineItem by sku', async () => {
		ctMock.clear()
		ctMock.project().add('product', product)
		ctMock.project().add('shopping-list', { ...shoppingList, lineItems: [] })

		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'addLineItem',
						sku: '22241940260',
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.lineItems).toHaveLength(1)
		expect(response.body.lineItems[0].variantId).toEqual(2)
	})

	test('addLineItem increases quantity', async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'addLineItem',
						sku: '22241940260',
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.lineItems).toHaveLength(1)
		expect(response.body.lineItems[0].variantId).toEqual(2)
		expect(response.body.lineItems[0].quantity).toEqual(2)
	})

	test('addLineItem unknown product', async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [{ action: 'addLineItem', productId: '123', variantId: 1 }],
			})
		expect(response.status).toBe(400)
		expect(response.body.message).toBe("A product with ID '123' not found.")
	})

	test('removeLineItem', async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'removeLineItem',
						lineItemId: shoppingList.lineItems[0].id,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.lineItems).toHaveLength(0)
	})

	test('removeLineItem decreases quantity', async () => {
		await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'addLineItem',
						sku: '22241940260',
					},
				],
			})

		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 2,
				actions: [
					{
						action: 'removeLineItem',
						lineItemId: shoppingList.lineItems[0].id,
						quantity: 1,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(3)
		expect(response.body.lineItems).toHaveLength(1)
		expect(response.body.lineItems[0].quantity).toBe(1)
	})

	test('changeLineItemQuantity sets quantity', async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'changeLineItemQuantity',
						lineItemId: shoppingList.lineItems[0].id,
						quantity: 2,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.lineItems.length).toBe(1)
		expect(response.body.lineItems[0].quantity).toBe(2)
	})

	test('changeLineItemQuantity removes line item if quantity is 0', async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/shopping-lists/${shoppingList.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'changeLineItemQuantity',
						lineItemId: shoppingList.lineItems[0].id,
						quantity: 0,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.lineItems.length).toBe(0)
	})
})
