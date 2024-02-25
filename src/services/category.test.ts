import type {
	Category,
	CategoryAddAssetAction,
	CategoryRemoveAssetAction,
} from "@commercetools/platform-sdk";
import assert from "assert";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

describe("Categories Query", () => {
	const ctMock = new CommercetoolsMock();
	let category: Category | undefined;

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/categories")
			.send({
				name: {
					en: "Top hat",
				},
				slug: {
					en: "top-hat",
				},
				orderHint: "0.1",
			});
		expect(response.status).toBe(201);

		category = response.body as Category;
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("no filter", async () => {
		const response = await supertest(ctMock.app)
			.get("/dummy/categories")
			.query({})
			.send();

		expect(response.status).toBe(200);
		expect(response.body.count).toBe(1);

		category = response.body.results[0] as Category;

		expect(category.name.en).toBe("Top hat");
	});
});

describe("categories changeName", () => {
	const ctMock = new CommercetoolsMock();
	let category: Category | undefined;

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/categories")
			.send({
				name: {
					en: "Top hat",
				},
				slug: {
					en: "top-hat",
				},
				orderHint: "0.1",
			});
		expect(response.status).toBe(201);
		category = response.body as Category;
	});

	test("changeName", async () => {
		const changeNameResponse = await supertest(ctMock.app)
			.post(`/dummy/categories/${category?.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeName",
						name: {
							en: "Top hat - new name",
						},
					},
				],
			});

		expect(changeNameResponse.status).toBe(200);
		expect(changeNameResponse.body.name.en).toBe("Top hat - new name");
	});
});

describe("categories changeParent", () => {
	const ctMock = new CommercetoolsMock();
	let category1: Category | undefined;
	let category2: Category | undefined;

	beforeEach(async () => {
		const response1 = await supertest(ctMock.app)
			.post("/dummy/categories")
			.send({
				name: {
					en: "Top hat",
				},
				slug: {
					en: "top-hat",
				},
				orderHint: "0.1",
			});
		expect(response1.status).toBe(201);
		category1 = response1.body as Category;

		const response2 = await supertest(ctMock.app)
			.post("/dummy/categories")
			.send({
				name: {
					en: "Top hat",
				},
				slug: {
					en: "top-hat",
				},
				orderHint: "0.1",
			});
		expect(response2.status).toBe(201);
		category2 = response2.body as Category;
	});

	test("changeParent", async () => {
		const changeNameResponse = await supertest(ctMock.app)
			.post(`/dummy/categories/${category2?.id}`)
			.send({
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
			});

		expect(changeNameResponse.status).toBe(200);
		expect(changeNameResponse.body.parent).toEqual({
			typeId: "category",
			id: category1?.id,
		});
	});
});

describe("Categories add asset", () => {
	const ctMock = new CommercetoolsMock();
	let category: Category | undefined;

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/categories")
			.send({
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
		expect(response.status).toBe(201);

		category = response.body as Category;
	});

	test("add second asset", async () => {
		assert(category, "category not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/categories/${category.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addAsset",
						asset: {
							key: "some-other-key",
						},
					} as CategoryAddAssetAction,
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.assets).toHaveLength(2);
		expect(response.body.assets[0].key).toEqual("some-key");
		expect(response.body.assets[1].key).toEqual("some-other-key");
	});
});

describe("Categories remove asset", () => {
	const ctMock = new CommercetoolsMock();
	let category: Category | undefined;

	beforeEach(async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/categories")
			.send({
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
		expect(response.status).toBe(201);

		category = response.body as Category;
	});

	test("remove assets by id and key", async () => {
		assert(category, "category not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/categories/${category.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeAsset",
						assetKey: category.assets[1].key,
					} as CategoryRemoveAssetAction,
					{
						action: "removeAsset",
						assetId: category.assets[0].id,
					} as CategoryRemoveAssetAction,
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.assets).toHaveLength(0);
	});
});
