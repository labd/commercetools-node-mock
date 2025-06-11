import type { AttributeGroupDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

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
					name: "size",
				},
				{
					key: "color",
					name: "color",
				},
			],
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/attribute-groups")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
			attributes: [
				{
					key: "size",
					name: "size",
				},
				{
					key: "color",
					name: "color",
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/attribute-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/attribute-groups/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Get attribute group by key", async () => {
		const draft: AttributeGroupDraft = {
			key: "key-group",
			name: {
				en: "Key Group",
			},
			attributes: [],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/attribute-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/attribute-groups/key=key-group",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Query attribute groups", async () => {
		const draft: AttributeGroupDraft = {
			key: "query-group",
			name: {
				en: "Query Group",
			},
			attributes: [],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/attribute-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/attribute-groups");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});