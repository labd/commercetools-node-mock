import assert from "node:assert";
import type {
	Category,
	CategoryAddAssetAction,
	CategoryRemoveAssetAction,
} from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	categoryDraftFactory,
	productDraftFactory,
	productTypeDraftFactory,
	storeDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

describe("Categories Query", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);
	let category: Category | undefined;

	beforeEach(async () => {
		category = await categoryDraft.create({
			name: {
				en: "Top hat",
			},
			slug: {
				en: "top-hat",
			},
			orderHint: "0.1",
		});
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	test("no filter", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/categories",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBe(1);

		category = response.json().results[0] as Category;

		expect(category.name.en).toBe("Top hat");
	});
});

describe("categories changeName", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);
	let category: Category | undefined;

	beforeEach(async () => {
		category = await categoryDraft.create({
			name: {
				en: "Top hat",
			},
			slug: {
				en: "top-hat",
			},
			orderHint: "0.1",
		});
	});

	test("changeName", async () => {
		const changeNameResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/categories/${category?.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "changeName",
						name: {
							en: "Top hat - new name",
						},
					},
				],
			},
		});

		expect(changeNameResponse.statusCode).toBe(200);
		expect(changeNameResponse.json().name.en).toBe("Top hat - new name");
	});
});

describe("Categories create with parent by key", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	test("create child category with parent specified by key", async () => {
		const parentCategory = await categoryDraft.create({
			key: "parent-key",
			name: {
				en: "Parent",
			},
			slug: {
				en: "parent",
			},
			orderHint: "0.1",
		});

		const childCategory = await categoryDraft.create({
			name: {
				en: "Child",
			},
			slug: {
				en: "child",
			},
			orderHint: "0.2",
			parent: {
				typeId: "category",
				key: "parent-key",
			},
		});

		expect(childCategory.parent).toEqual({
			typeId: "category",
			id: parentCategory.id,
		});
		expect(childCategory.ancestors).toHaveLength(1);
		expect(childCategory.ancestors[0].id).toEqual(parentCategory.id);
	});

	test("get child category by key resolves ancestors from parent specified by key", async () => {
		const parentCategory = await categoryDraft.create({
			key: "parent-key",
			name: {
				en: "Parent",
			},
			slug: {
				en: "parent",
			},
			orderHint: "0.1",
		});

		await categoryDraft.create({
			key: "child-key",
			name: {
				en: "Child",
			},
			slug: {
				en: "child",
			},
			orderHint: "0.2",
			parent: {
				typeId: "category",
				key: "parent-key",
			},
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/categories/key=child-key",
		});

		expect(response.statusCode).toBe(200);

		const result = response.json();
		expect(result.parent).toEqual({
			typeId: "category",
			id: parentCategory.id,
		});
		expect(result.ancestors).toHaveLength(1);
		expect(result.ancestors[0].id).toEqual(parentCategory.id);
	});
});

describe("categories changeParent", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);
	let category1: Category | undefined;
	let category2: Category | undefined;

	beforeEach(async () => {
		category1 = await categoryDraft.create({
			name: {
				en: "Top hat",
			},
			slug: {
				en: "top-hat",
			},
			orderHint: "0.1",
		});

		category2 = await categoryDraft.create({
			name: {
				en: "Top hat",
			},
			slug: {
				en: "top-hat",
			},
			orderHint: "0.1",
		});
	});

	test("changeParent", async () => {
		const child = await categoryDraft.create({
			parent: { typeId: "category", id: category2?.id as string },
		});
		const grandchild = await categoryDraft.create({
			parent: { typeId: "category", id: child.id },
		});

		const changeNameResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/categories/${category2?.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "changeParent",
						parent: {
							typeId: "category",
							id: category1?.id,
						},
					},
				],
			},
		});

		expect(changeNameResponse.statusCode).toBe(200);
		expect(changeNameResponse.json().parent).toEqual({
			typeId: "category",
			id: category1?.id,
		});
		expect(changeNameResponse.json().ancestors).toHaveLength(1);
		expect(changeNameResponse.json().ancestors[0].id).toEqual(category1?.id);

		const grandchildResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/categories/${grandchild.id}`,
			query: { expand: "parent" },
		});
		expect(grandchildResponse.json().parent.obj.ancestors).toEqual([
			{ typeId: "category", id: category2?.id },
			{ typeId: "category", id: category1?.id },
		]);
	});
});

describe("Categories delete", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);
	const productDraft = productDraftFactory(ctMock);
	const productTypeDraft = productTypeDraftFactory(ctMock);

	test("deletes the subtree and removes it from products", async () => {
		const parent = await categoryDraft.create();
		const child = await categoryDraft.create({
			parent: { typeId: "category", id: parent.id },
		});
		const sibling = await categoryDraft.create();
		const productType = await productTypeDraft.create();
		const product = await productDraft.create({
			publish: true,
			productType: { typeId: "product-type", id: productType.id },
			categories: [child, sibling].map(({ id }) => ({
				typeId: "category",
				id,
			})),
		});

		const response = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/categories/${parent.id}`,
			query: { version: String(parent.version) },
		});
		expect(response.statusCode).toBe(200);

		const childResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/categories/${child.id}`,
		});
		expect(childResponse.statusCode).toBe(404);

		const productResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/products/${product.id}`,
		});
		const { current, staged } = productResponse.json().masterData;
		const remaining = [{ typeId: "category", id: sibling.id }];
		expect(current.categories).toEqual(remaining);
		expect(staged.categories).toEqual(remaining);
	});
});

describe("Categories add asset", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);
	let category: Category | undefined;

	beforeEach(async () => {
		category = await categoryDraft.create({
			name: {
				en: "Top hat",
			},
			slug: {
				en: "top-hat",
			},
			orderHint: "0.1",
			assets: [
				{
					key: "some-key",
					sources: [],
					name: { en: "Some Asset" },
				},
			],
		});
	});

	test("add second asset", async () => {
		assert(category, "category not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/categories/${category.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addAsset",
						asset: {
							key: "some-other-key",
						},
					} as CategoryAddAssetAction,
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().assets).toHaveLength(2);
		expect(response.json().assets[0].key).toEqual("some-key");
		expect(response.json().assets[1].key).toEqual("some-other-key");
	});
});

describe("Categories remove asset", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);
	let category: Category | undefined;

	beforeEach(async () => {
		category = await categoryDraft.create({
			name: {
				en: "Top hat",
			},
			slug: {
				en: "top-hat",
			},
			orderHint: "0.1",
			assets: [
				{
					key: "some-key",
					sources: [],
					name: { en: "Some Asset" },
				},
				{
					key: "some-other-key",
					sources: [],
					name: { en: "Some Other Asset" },
				},
			],
		});
	});

	test("remove assets by id and key", async () => {
		assert(category, "category not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/categories/${category.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "removeAsset",
						assetKey: category.assets?.[1].key,
					} as CategoryRemoveAssetAction,
					{
						action: "removeAsset",
						assetId: category.assets?.[0].id,
					} as CategoryRemoveAssetAction,
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().assets).toHaveLength(0);
	});
});

describe("Categories stores", () => {
	const ctMock = new CommercetoolsMock();
	const categoryDraft = categoryDraftFactory(ctMock);
	const storeDraft = storeDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	test("create with stores and update them", async () => {
		await storeDraft.create({ key: "store-a" });
		await storeDraft.create({ key: "store-b" });

		const category = await categoryDraft.create({
			name: { en: "Top hat" },
			slug: { en: "top-hat" },
			stores: [{ typeId: "store", key: "store-a" }],
		});
		expect(category.stores).toEqual([{ typeId: "store", key: "store-a" }]);

		const update = async (version: number, actions: unknown[]) =>
			ctMock.app.inject({
				method: "POST",
				url: `/dummy/categories/${category.id}`,
				payload: { version, actions },
			});

		let response = await update(1, [
			{ action: "addStore", store: { typeId: "store", key: "store-b" } },
		]);
		expect(response.statusCode).toBe(200);
		expect(response.json().stores).toEqual([
			{ typeId: "store", key: "store-a" },
			{ typeId: "store", key: "store-b" },
		]);

		response = await update(response.json().version, [
			{ action: "removeStore", store: { typeId: "store", key: "store-a" } },
		]);
		expect(response.statusCode).toBe(200);
		expect(response.json().stores).toEqual([
			{ typeId: "store", key: "store-b" },
		]);

		response = await update(response.json().version, [
			{ action: "setStores", stores: [] },
		]);
		expect(response.statusCode).toBe(200);
		expect(response.json().stores).toEqual([]);
	});
});
