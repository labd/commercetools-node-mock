import type {
	Category,
	CategoryAddAssetAction,
	CategoryRemoveAssetAction,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { beforeEach, afterEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index.js'
import assert from 'assert'

describe('Categories Query', () => {
	const ctMock = new CommercetoolsMock()
	let category: Category | undefined

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post('/dummy/categories')
			.send({
				name: {
					en: 'Top hat',
				},
				slug: {
					en: 'top-hat',
				},
				orderHint: '0.1',
			})
		expect(response.status).toBe(201)

		category = response.body as Category
	})

	afterEach(() => {
		ctMock.clear()
	})

	test('no filter', async () => {
		const response = await supertest(ctMock.app)
			.get('/dummy/categories')
			.query({})
			.send()

		expect(response.status).toBe(200)
		expect(response.body.count).toBe(1)

		const category = response.body.results[0] as Category

		expect(category.name.en).toBe('Top hat')
	})
})

describe('Categories add asset', () => {
	const ctMock = new CommercetoolsMock()
	let category: Category | undefined

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post('/dummy/categories')
			.send({
				name: {
					en: 'Top hat',
				},
				slug: {
					en: 'top-hat',
				},
				orderHint: '0.1',
				assets: [
					{
						key: 'some-key',
					},
				],
			})
		expect(response.status).toBe(201)

		category = response.body as Category
	})

	test('add second asset', async () => {
		assert(category, 'category not created')

		const response = await supertest(ctMock.app)
			.post(`/dummy/categories/${category.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'addAsset',
						asset: {
							key: 'some-other-key',
						},
					} as CategoryAddAssetAction,
				],
			})

		expect(response.status).toBe(200)
		expect(response.body.assets).toHaveLength(2)
		expect(response.body.assets[0].key).toEqual('some-key')
		expect(response.body.assets[1].key).toEqual('some-other-key')
	})
})

describe('Categories remove asset', () => {
	const ctMock = new CommercetoolsMock()
	let category: Category | undefined

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post('/dummy/categories')
			.send({
				name: {
					en: 'Top hat',
				},
				slug: {
					en: 'top-hat',
				},
				orderHint: '0.1',
				assets: [
					{
						key: 'some-key',
					},
					{
						key: 'some-other-key',
					},
				],
			})
		expect(response.status).toBe(201)

		category = response.body as Category
	})

	test('remove assets by id and key', async () => {
		assert(category, 'category not created')

		const response = await supertest(ctMock.app)
			.post(`/dummy/categories/${category.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: 'removeAsset',
						assetKey: category.assets[1].key,
					} as CategoryRemoveAssetAction,
					{
						action: 'removeAsset',
						assetId: category.assets[0].id,
					} as CategoryRemoveAssetAction,
				],
			})

		expect(response.status).toBe(200)
		expect(response.body.assets).toHaveLength(0)
	})
})
