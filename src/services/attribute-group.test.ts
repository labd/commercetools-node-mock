import type { AttributeGroupDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("AttributeGroup", () => {
	test("Create attribute group", async () => {
		const draft: AttributeGroupDraft = {
			key: "product-specifications",
			name: {
				en: "Product Specifications",
			},
			attributes: [
				{
					key: "size",
				},
				{
					key: "color",
				},
			],
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/attribute-groups",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			attributes: [
				{
					key: "size",
				},
				{
					key: "color",
				},
			],
			createdAt: expect.anything(),
			id: expect.anything(),
			key: "product-specifications",
			lastModifiedAt: expect.anything(),
			name: {
				en: "Product Specifications",
			},
			version: 1,
		});
	});

	test("Get attribute group", async () => {
		const draft: AttributeGroupDraft = {
			key: "test-group",
			name: {
				en: "Test Group",
			},
			attributes: [],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/attribute-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/attribute-groups/${createBody.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
	});

	test("Get attribute group by key", async () => {
		const draft: AttributeGroupDraft = {
			key: "key-group",
			name: {
				en: "Key Group",
			},
			attributes: [],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/attribute-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/attribute-groups/key=key-group",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
	});

	test("Query attribute groups", async () => {
		const draft: AttributeGroupDraft = {
			key: "query-group",
			name: {
				en: "Query Group",
			},
			attributes: [],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/attribute-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/attribute-groups",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.count).toBeGreaterThan(0);
		expect(body.results).toContainEqual(createBody);
	});
});
