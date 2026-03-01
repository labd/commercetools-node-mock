import { afterEach, describe, expect, test } from "vitest";
import { taxCategoryDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Tax Category", () => {
	const taxCategoryDraft = taxCategoryDraftFactory(ctMock);

	afterEach(() => {
		ctMock.clear();
	});
	test("Create tax category", async () => {
		const draft = taxCategoryDraft.build({
			name: "foo",
			key: "standard",
			rates: [],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/tax-categories",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			lastModifiedAt: expect.anything(),
			name: "foo",
			rates: [],
			key: "standard",
			version: 1,
		});
	});

	test("Get tax category", async () => {
		const taxCategory = await taxCategoryDraft.create({
			name: "foo",
			key: "standard",
			rates: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/tax-categories/${taxCategory.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(taxCategory);
	});

	test("Get tax category with key", async () => {
		const taxCategory = await taxCategoryDraft.create({
			name: "foo",
			key: "standard",
			rates: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/tax-categories/?where=${encodeURIComponent(`key="${taxCategory.key}"`)}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
			count: 1,
			limit: 20,
			offset: 0,
			total: 1,
			results: [taxCategory],
		});
	});
});
