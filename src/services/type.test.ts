import type { TypeDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

const ctMock = new CommercetoolsMock();

describe("Type", () => {
	test("Create type", async () => {
		const draft: TypeDraft = {
			key: "my-custom-type",
			name: {
				en: "My Custom Type",
			},
			resourceTypeIds: ["category"],
			fieldDefinitions: [
				{
					name: "customField",
					label: {
						en: "Custom Field",
					},
					required: false,
					type: {
						name: "String",
					},
				},
			],
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/types")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
			createdAt: expect.anything(),
			fieldDefinitions: [
				{
					label: {
						en: "Custom Field",
					},
					name: "customField",
					required: false,
					type: {
						name: "String",
					},
				},
			],
			id: expect.anything(),
			key: "my-custom-type",
			lastModifiedAt: expect.anything(),
			name: {
				en: "My Custom Type",
			},
			resourceTypeIds: ["category"],
			version: 1,
		});
	});

	test("Get type", async () => {
		const draft: TypeDraft = {
			key: "test-type",
			name: {
				en: "Test Type",
			},
			resourceTypeIds: ["product"],
			fieldDefinitions: [],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/types")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/types/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Get type by key", async () => {
		const draft: TypeDraft = {
			key: "key-type",
			name: {
				en: "Key Type",
			},
			resourceTypeIds: ["customer"],
			fieldDefinitions: [],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/types")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/types/key=key-type",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Query types", async () => {
		const draft: TypeDraft = {
			key: "query-type",
			name: {
				en: "Query Type",
			},
			resourceTypeIds: ["order"],
			fieldDefinitions: [],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/types")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/types");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});
