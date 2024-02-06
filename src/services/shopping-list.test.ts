import { Product, ShoppingList } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../ctMock'

const shoppingList: ShoppingList = {
	id: 'f15b4a80-7def-4381-bf6a-c66cab258a2b',
	version: 3,
	lineItems: [
		{
			addedAt: '2021-08-03T14:19:29.496Z',
			productType: { typeId: 'product-type', id: 'product-type-id' },
			id: '42ea3c57-aced-49ea-ae70-7005a47c7463',
			productId: '303bf5d8-1201-4fb9-8157-ff6efb8c04b4',
			name: { 'en-GB': '2 Pack Trunks Mens' },
			quantity: 1,
			productSlug: { 'en-GB': 'product-42201103' },
			variantId: 2,
		},
	],
	textLineItems: [],
	createdAt: '2021-07-22T12:23:33.472Z',
	lastModifiedAt: '2021-08-03T14:19:29.496Z',
	name: { 'en-GB': 'foo' },
}

export const product: Product = {
	id: '303bf5d8-1201-4fb9-8157-ff6efb8c04b4',
	createdAt: '2022-05-30T13:21:26.777Z',
	lastModifiedAt: '2022-05-30T13:21:26.777Z',
	key: '76149475',
	version: 1,
	productType: {
		typeId: 'product-type',
		id: '303bf5d8-1201-4fb9-8157-ff6efb8c04b4',
	},
	masterData: {
		staged: {
			name: { 'en-GB': 'test product' },
			categories: [],
			slug: { 'en-GB': 'test-product' },
			masterVariant: {
				id: 1,
				sku: '22241940260',
				attributes: [{ name: 'test', value: 'test' }],
				prices: [],
			},
			variants: [],
			searchKeywords: {},
		},
		current: {
			name: { 'en-GB': 'test product' },
			slug: { 'en-GB': 'test-product' },
			description: { 'en-GB': 'test product' },
			metaDescription: { 'en-GB': 'test product' },
			metaKeywords: { 'en-GB': 'foo, bar' },
			categories: [],
			masterVariant: {
				id: 1,
				sku: '22241940260',
				attributes: [],
				prices: [],
				availability: {
					channels: {
						'd63b6da3-6b4c-43ca-9e46-d43f866fd388': {
							id: 'd63b6da3-6b4c-43ca-9e46-d43f866fd388',
							version: 1,
							isOnStock: true,
							restockableInDays: 0,
							availableQuantity: 361,
						},
					},
				},
				price: {
					id: 'd63b6da3-6b4c-43ca-9e46-d43f866fd388',
					value: {
						type: 'centPrecision',
						currencyCode: 'MYR',
						centAmount: 9200,
						fractionDigits: 2,
					},
				},
			},
			variants: [
				{
					id: 2,
					sku: '22241940260',
					attributes: [],
					prices: [],
					availability: {
						channels: {
							'd63b6da3-6b4c-43ca-9e46-d43f866fd388': {
								id: 'd63b6da3-6b4c-43ca-9e46-d43f866fd388',
								version: 1,
								isOnStock: true,
								restockableInDays: 0,
								availableQuantity: 361,
							},
						},
					},
					images: [],
					price: {
						id: '303bf5d8-1201-4fb9-8157-ff6efb8c04b4',
						value: {
							type: 'centPrecision',
							currencyCode: 'MYR',
							centAmount: 9200,
							fractionDigits: 2,
						},
					},
				},
			],
			searchKeywords: {},
		},
		hasStagedChanges: true,
		published: true,
	},
}

describe('Shopping list', () => {
	const ctMock = new CommercetoolsMock({
		defaultProjectKey: 'dummy',
	})

	beforeEach(() => {
		ctMock.project().add('product', product)
		ctMock.project().add('shopping-list', shoppingList)
	})

	test('Adds variant ID on lineItems when creating', () => {})

	test('Expands variant on lineItems', async () => {
		const response = await supertest(ctMock.app)
			.get(`/dummy/shopping-lists/${shoppingList.id}`)
			.query({ expand: 'lineItems[*].variant' })

		expect(response.status).toBe(200)
		expect(response.body.lineItems[0].variantId).toBe(2)
		expect(response.body.lineItems[0].variant).toEqual(
			product.masterData.current.variants[0]
		)
	})
})
