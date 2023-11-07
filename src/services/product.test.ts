import type {
	Category,
	CategoryDraft,
	Image,
	PriceDraft,
	Product,
	ProductData,
	ProductDraft,
	ProductType,
	ProductTypeDraft,
	State,
	StateDraft,
	TaxCategory,
	TaxCategoryDraft,
} from '@commercetools/platform-sdk'
import assert from 'assert'
import supertest from 'supertest'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index.js'

const productTypeDraft: ProductTypeDraft = {
	key: 'test-product-type',
	name: 'Test Product Type',
	description: 'Test Product Type description',
}

const categoryDraft: CategoryDraft = {
	key: 'category-1',
	name: {
		'nl-NL': 'Category One',
	},
	slug: {
		'nl-NL': 'category_1',
	},
}

const taxcategoryDraft: TaxCategoryDraft = {
	name: 'Tax category 1',
	key: 'tax-category-1',
}

const productStateDraft: StateDraft = {
	key: 'initial-state',
	type: 'ProductState',
	initial: true,
	name: {
		'nl-NL': 'Initial state',
	},
	description: {
		'nl-NL': 'Product initial state',
	},
}

const publishedProductDraft: ProductDraft = {
	name: {
		'nl-NL': 'test published product',
	},
	description: {
		'nl-NL': 'Test published product description',
	},
	productType: {
		typeId: 'product-type',
		key: 'test-product-type',
	},
	categories: [
		{
			typeId: 'category',
			key: 'category-1',
		},
	],
	taxCategory: {
		typeId: 'tax-category',
		key: taxcategoryDraft.key,
	},
	state: {
		typeId: 'state',
		key: 'initial-state',
	},
	masterVariant: {
		key: 'master-variant-key',
		sku: '1337',
		attributes: [
			{
				name: 'test',
				value: 'test',
			},
		],
		prices: [
			{
				key: 'base_price_eur',
				country: 'NL',
				value: {
					currencyCode: 'EUR',
					centAmount: 1000,
				},
			},
		],
	},
	variants: [
		{
			key: 'variant-1-key',
			sku: '1338',
			attributes: [
				{
					name: 'test2',
					value: 'test2',
				},
			],
			prices: [
				{
					key: 'base_price_eur',
					country: 'NL',
					value: {
						currencyCode: 'EUR',
						centAmount: 2000,
					},
				},
			],
		},
	],
	slug: {
		'nl-NL': 'test-published-product',
	},
	metaTitle: {
		'nl-NL': 'Unpublished product (meta title)',
	},
	metaDescription: {
		'nl-NL': 'Unpublished product description (meta description)',
	},
	metaKeywords: {
		'nl-NL': 'Test product (meta Keywords)',
	},
	publish: true,
}

const unpublishedProductDraft: ProductDraft = {
	key: 'test-unpublished-product',
	name: {
		'nl-NL': 'test unpublished product',
	},
	description: {
		'nl-NL': 'Test published product description',
	},
	productType: {
		typeId: 'product-type',
		key: 'test-product-type',
	},
	categories: [
		{
			typeId: 'category',
			key: 'category-1',
		},
	],
	taxCategory: {
		typeId: 'tax-category',
		key: taxcategoryDraft.key,
	},
	state: {
		typeId: 'state',
		key: 'initial-state',
	},
	masterVariant: {
		key: 'master-variant-key',
		sku: '2337',
		attributes: [
			{
				name: 'test',
				value: 'test',
			},
		],
		prices: [
			{
				key: 'base_price_eur',
				country: 'NL',
				value: {
					currencyCode: 'EUR',
					centAmount: 1000,
				},
			},
		],
	},
	variants: [
		{
			key: 'variant-1-key',
			sku: '2338',
			attributes: [
				{
					name: 'test2',
					value: 'test2',
				},
			],
			prices: [
				{
					key: 'base_price_eur',
					country: 'NL',
					value: {
						currencyCode: 'EUR',
						centAmount: 2000,
					},
				},
			],
		},
	],
	slug: {
		'nl-NL': 'test-unpublished-product',
	},
	metaTitle: {
		'nl-NL': 'Unpublished product (meta title)',
	},
	metaDescription: {
		'nl-NL': 'Unpublished product description (meta description)',
	},
	metaKeywords: {
		'nl-NL': 'Test product (meta Keywords)',
	},
	publish: false,
}

let productType: ProductType
let category: Category
let taxCategory: TaxCategory
let productState: State

async function beforeAllProductTests(mock) {
	let response
	// Create Product Type
	response = await supertest(mock.app)
		.post('/dummy/product-types')
		.send(productTypeDraft)

	expect(response.status).toBe(201)
	productType = response.body

	// Create Category
	response = await supertest(mock.app)
		.post('/dummy/categories')
		.send(categoryDraft)

	expect(response.status).toBe(201)
	category = response.body

	// Create Tax Category
	response = await supertest(mock.app)
		.post('/dummy/tax-categories')
		.send(taxcategoryDraft)

	expect(response.status).toBe(201)
	taxCategory = response.body

	// Create Product State
	response = await supertest(mock.app)
		.post('/dummy/states')
		.send(productStateDraft)

	expect(response.status).toBe(201)
	productState = response.body
}

describe('Product', () => {
	const ctMock = new CommercetoolsMock()
	beforeAll(async () => {
		await beforeAllProductTests(ctMock)
	})

	test('Create product', async () => {
		assert(productType, 'product type not created')

		const response = await supertest(ctMock.app)
			.post('/dummy/products')
			.send(unpublishedProductDraft)

		const productData: ProductData = {
			name: {
				'nl-NL': 'test unpublished product',
			},
			description: {
				'nl-NL': 'Test published product description',
			},
			slug: {
				'nl-NL': 'test-unpublished-product',
			},
			categories: [
				{
					id: category.id,
					typeId: 'category',
				},
			],
			metaTitle: {
				'nl-NL': 'Unpublished product (meta title)',
			},
			metaDescription: {
				'nl-NL': 'Unpublished product description (meta description)',
			},
			metaKeywords: {
				'nl-NL': 'Test product (meta Keywords)',
			},
			masterVariant: {
				id: 1,
				key: 'master-variant-key',
				sku: '2337',
				assets: [],
				attributes: [
					{
						name: 'test',
						value: 'test',
					},
				],
				prices: [
					{
						id: expect.anything(),
						key: 'base_price_eur',
						country: 'NL',
						value: {
							type: 'centPrecision',
							centAmount: 1000,
							currencyCode: 'EUR',
							fractionDigits: 2,
						},
					},
				],
				images: [],
			},
			variants: [
				{
					key: 'variant-1-key',
					sku: '2338',
					assets: [],
					id: 2,
					images: [],
					attributes: [
						{
							name: 'test2',
							value: 'test2',
						},
					],
					prices: [
						{
							id: expect.anything(),
							key: 'base_price_eur',
							country: 'NL',
							value: {
								type: 'centPrecision',
								centAmount: 2000,
								currencyCode: 'EUR',
								fractionDigits: 2,
							},
						},
					],
				},
			],
			searchKeywords: {},
		}

		expect(response.body).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			lastModifiedAt: expect.anything(),
			key: 'test-unpublished-product',
			taxCategory: {
				typeId: 'tax-category',
				id: taxCategory.id,
			},
			masterData: {
				staged: productData,
				current: productData,
				hasStagedChanges: false,
				published: false,
			},
			productType: {
				typeId: 'product-type',
				id: productType.id,
			},
			state: {
				typeId: 'state',
				id: productState.id,
			},
			version: 1,
		} as Product)
	})
})

describe('Product update actions', () => {
	const ctMock = new CommercetoolsMock()
	let productPublished: Product | undefined
	beforeAll(async () => {
		await beforeAllProductTests(ctMock)
	})

	beforeEach(async () => {
		let response
		response = await supertest(ctMock.app)
			.post('/dummy/products')
			.send(publishedProductDraft)

		expect(response.status).toBe(201)
		productPublished = response.body

		response = await supertest(ctMock.app)
			.post('/dummy/products')
			.send(unpublishedProductDraft)

		expect(response.status).toBe(201)
	})

	test('setAttribute masterVariant (staged)', async () => {
		assert(productPublished, 'product not created')

		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 1,
					actions: [
						{ action: 'setAttribute', sku: '1337', name: 'foo', value: 'bar' },
					],
				})

			expect(response.status).toBe(200)
			const product: Product = response.body
			expect(product.version).toBe(2)
			expect(product.masterData.hasStagedChanges).toBeTruthy()
			expect(product.masterData.current.masterVariant.attributes).toHaveLength(
				1
			)
			expect(product.masterData.staged.masterVariant.attributes).toHaveLength(2)

			const attr = response.body.masterData.staged.masterVariant.attributes[1]
			expect(attr).toEqual({ name: 'foo', value: 'bar' })
		}

		// Publish
		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 2,
					actions: [{ action: 'publish', scope: 'All' }],
				})

			expect(response.status).toBe(200)
			const product: Product = response.body
			expect(product.version).toBe(3)
			expect(product.masterData.hasStagedChanges).toBeFalsy()
			expect(product.masterData.current.masterVariant.attributes).toHaveLength(
				2
			)
		}
	})

	test('setAttribute masterVariant (published)', async () => {
		assert(productPublished, 'product not created')

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'setAttribute',
						sku: '1337',
						name: 'foo',
						value: 'bar',
						staged: false,
					},
				],
			})

		expect(response.status).toBe(200)
		const product: Product = response.body

		// TODO: Since we auto publish it actually does two version updates. So the
		// version should be 3
		expect(product.version).toBe(2)
		expect(product.masterData.hasStagedChanges).toBeFalsy()
		expect(product.masterData.current.masterVariant.attributes).toHaveLength(2)
		expect(product.masterData.staged.masterVariant.attributes).toHaveLength(2)

		const attr = response.body.masterData.staged.masterVariant.attributes[1]
		expect(attr).toEqual({ name: 'foo', value: 'bar' })
	})

	test('setAttribute variant', async () => {
		assert(productPublished, 'product not created')

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{ action: 'setAttribute', sku: '1338', name: 'foo', value: 'bar' },
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.variants[0].attributes).toHaveLength(
			2
		)
		const attr = response.body.masterData.staged.variants[0].attributes[1]
		expect(attr).toEqual({ name: 'foo', value: 'bar' })
	})

	test('setAttribute variant and publish', async () => {
		assert(productPublished, 'product not created')

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{ action: 'setAttribute', sku: '1338', name: 'foo', value: 'bar' },
					{ action: 'publish' },
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(3)
		expect(
			response.body.masterData.current.variants[0].attributes
		).toHaveLength(2)
		const attr = response.body.masterData.current.variants[0].attributes[1]
		expect(attr).toEqual({ name: 'foo', value: 'bar' })
	})

	test('setAttribute overwrite', async () => {
		assert(productPublished, 'product not created')

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{ action: 'setAttribute', sku: '1337', name: 'test', value: 'foo' },
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(
			response.body.masterData.staged.masterVariant.attributes
		).toHaveLength(1)
		const attr = response.body.masterData.staged.masterVariant.attributes[0]
		expect(attr).toEqual({ name: 'test', value: 'foo' })
	})

	test('addExternalImage variant', async () => {
		assert(productPublished, 'product not created')

		const image: Image = {
			url: 'http://example.com/image',
			dimensions: { w: 100, h: 100 },
		}
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [{ action: 'addExternalImage', sku: '1338', image }],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.variants[0].images).toHaveLength(1)
		const attr = response.body.masterData.staged.variants[0].images[0]
		expect(attr).toEqual(image)
	})

	test('removeImage variant', async () => {
		assert(productPublished, 'product not created')

		const image: Image = {
			url: 'http://example.com/image',
			dimensions: { w: 100, h: 100 },
		}

		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 1,
					actions: [{ action: 'addExternalImage', sku: '1338', image }],
				})
			expect(response.status).toBe(200)
			expect(response.body.version).toBe(2)
		}

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 2,
				actions: [
					{
						action: 'removeImage',
						sku: '1338',
						imageUrl: image.url,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(3)
		expect(response.body.masterData.staged.variants[0].images).toHaveLength(0)
	})

	test('moveImageToPosition variant', async () => {
		assert(productPublished, 'product not created')

		const image1: Image = {
			url: 'http://example.com/image1',
			dimensions: { w: 100, h: 100 },
		}
		const image2: Image = {
			url: 'http://example.com/image2',
			dimensions: { w: 100, h: 100 },
		}

		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 1,
					actions: [
						{ action: 'addExternalImage', sku: '1338', image: image1 },
						{ action: 'addExternalImage', sku: '1338', image: image2 },
					],
				})
			expect(response.status).toBe(200)
			expect(response.body.version).toBe(3)
		}

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 3,
				actions: [
					{
						action: 'moveImageToPosition',
						sku: '1338',
						imageUrl: image2.url,
						position: 0,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(4)
		expect(response.body.masterData.staged.variants[0].images).toEqual([
			{ url: 'http://example.com/image2', dimensions: { w: 100, h: 100 } },
			{ url: 'http://example.com/image1', dimensions: { w: 100, h: 100 } },
		])
	})

	test('addPrice variant', async () => {
		assert(productPublished, 'product not created')

		const priceDraft: PriceDraft = {
			country: 'BE',
			value: {
				currencyCode: 'EUR',
				centAmount: 3000,
			},
		}

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'addPrice',
						price: priceDraft,
						variantId: 1,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.masterVariant.prices).toMatchObject([
			{
				country: 'NL',
				value: {
					currencyCode: 'EUR',
					centAmount: 1000,
				},
			},
			{
				country: 'BE',
				value: {
					currencyCode: 'EUR',
					centAmount: 3000,
				},
			},
		])
	})

	test('changePrice variant', async () => {
		assert(productPublished, 'product not created')
		const priceId =
			productPublished?.masterData.current.masterVariant.prices?.[0].id
		assert(priceId)

		const priceDraft: PriceDraft = {
			country: 'BE',
			value: {
				currencyCode: 'EUR',
				centAmount: 3000,
			},
		}

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'changePrice',
						priceId,
						price: priceDraft,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.masterVariant.prices).toMatchObject([
			{
				id: priceId,
				country: 'BE',
				value: {
					currencyCode: 'EUR',
					centAmount: 3000,
				},
			},
		])
	})

	test('removePrice variant', async () => {
		assert(productPublished, 'product not created')
		const priceId =
			productPublished?.masterData.current.masterVariant.prices?.[0].id
		assert(priceId)

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'removePrice',
						priceId,
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.masterVariant.prices).toHaveLength(0)
	})

	test('changeName product', async () => {
		assert(productPublished, 'product not created')
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'changeName',
						name: 'new test published product',
						staged: false
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.name).toBe('new test published product')
		expect(response.body.masterData.current.name).toBe('new test published product')
	})

	test('changeSlug product', async () => {
		assert(productPublished, 'product not created')
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'changeSlug',
						slug: {
							'nl-NL': 'test-published-product-new',
						},
						staged: false
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.slug).toEqual({'nl-NL': 'test-published-product-new'})
		expect(response.body.masterData.current.slug).toEqual({'nl-NL': 'test-published-product-new'})
	})

	test('setMetaTitle product', async () => {
		assert(productPublished, 'product not created')
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'setMetaTitle',
						metaTitle: {
							'nl-NL': 'Unpublished product (new meta title)',
						},
						staged: false
					},
				],
			})
		expect(response.status).toBe(200)
		expect(response.body.version).toBe(2)
		expect(response.body.masterData.staged.metaTitle).toEqual({'nl-NL': 'Unpublished product (new meta title)'})
		expect(response.body.masterData.current.metaTitle).toEqual({'nl-NL': 'Unpublished product (new meta title)'})
	})
})
