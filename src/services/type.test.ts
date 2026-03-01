import { describe, expect, test } from "vitest";
import { typeDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Type", () => {
	const factory = typeDraftFactory(ctMock);

	test("Create type", async () => {
		const draft = factory.build({
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
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		const type = response.json();
		expect(type).toEqual({
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			description: {
				en: "Type description",
			},
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
			lastModifiedBy: expect.anything(),
			name: {
				en: "My Custom Type",
			},
			resourceTypeIds: ["category"],
			version: 1,
		});
	});

	test("Get type", async () => {
		const type = await factory.create({
			key: "test-type",
			name: {
				en: "Test Type",
			},
			resourceTypeIds: ["product"],
			fieldDefinitions: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/types/${type.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(type);
	});

	test("Get type by key", async () => {
		const type = await factory.create({
			key: "key-type",
			name: {
				en: "Key Type",
			},
			resourceTypeIds: ["customer"],
			fieldDefinitions: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/types/key=key-type",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(type);
	});

	test("Query types", async () => {
		const type = await factory.create({
			key: "query-type",
			name: {
				en: "Query Type",
			},
			resourceTypeIds: ["order"],
			fieldDefinitions: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/types",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.count).toBeGreaterThan(0);
		expect(body.results).toContainEqual(type);
	});
});
