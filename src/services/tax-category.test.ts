import type { TaxCategoryDraft } from "@commercetools/platform-sdk";
import { afterEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Tax Category", () => {
	afterEach(() => {
		ctMock.clear();
	});
	test("Create tax category", async () => {
		const draft: TaxCategoryDraft = {
			name: "foo",
			key: "standard",
			rates: [],
		};
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
		const draft: TaxCategoryDraft = {
			name: "foo",
			key: "standard",
			rates: [],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/tax-categories",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/tax-categories/${createBody.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
	});

	test("Get tax category with key", async () => {
		const draft: TaxCategoryDraft = {
			name: "foo",
			key: "standard",
			rates: [],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/tax-categories",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/tax-categories/?where=${encodeURIComponent(`key="${createBody.key}"`)}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
			count: 1,
			limit: 20,
			offset: 0,
			total: 1,
			results: [createBody],
		});
	});
});
