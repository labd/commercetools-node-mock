import assert from "node:assert";
import type {
	Category,
	CategoryAddAssetAction,
	CategoryRemoveAssetAction,
} from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { categoryDraftFactory } from "#src/testing/index.ts";
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

	afterEach(() => {
		ctMock.clear();
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
				},
				{
					key: "some-other-key",
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
