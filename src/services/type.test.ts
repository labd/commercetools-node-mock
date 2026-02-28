import type { TypeDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

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
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
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
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/types/${createBody.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
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
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/types/key=key-type",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
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
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/types",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.count).toBeGreaterThan(0);
		expect(body.results).toContainEqual(createBody);
	});
});
