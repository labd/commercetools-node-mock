import { describe, expect, test } from "vitest";
import { productTypeDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Product type", () => {
	const productTypeDraft = productTypeDraftFactory(ctMock);

	test("Create product type", async () => {
		const draft = productTypeDraft.build({
			name: "foo",
			description: "bar",
			attributes: [
				{
					name: "name",
					type: { name: "boolean" },
					label: { "nl-NL": "bar" },
					isRequired: false,
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-types",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			attributes: [
				{
					attributeConstraint: "None",
					inputHint: "SingleLine",
					isRequired: false,
					isSearchable: true,
					label: {
						"nl-NL": "bar",
					},
					level: "Variant",
					name: "name",
					type: {
						name: "boolean",
					},
				},
			],
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			description: "bar",
			id: expect.anything(),
			key: expect.anything(),
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			name: "foo",
			version: 1,
		});
	});

	test("Update product type - setKey", async () => {
		const productType = await productTypeDraft.create({
			name: "test-setKey",
			description: "desc",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/product-types/${productType.id}`,
			payload: {
				version: productType.version,
				actions: [{ action: "setKey", key: "new-key" }],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().key).toBe("new-key");
	});

	test("Update product type - changeName", async () => {
		const productType = await productTypeDraft.create({
			name: "old-name",
			description: "desc",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/product-types/${productType.id}`,
			payload: {
				version: productType.version,
				actions: [{ action: "changeName", name: "new-name" }],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().name).toBe("new-name");
	});

	test("Update product type - changeDescription", async () => {
		const productType = await productTypeDraft.create({
			name: "test-changeDesc",
			description: "old-desc",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/product-types/${productType.id}`,
			payload: {
				version: productType.version,
				actions: [{ action: "changeDescription", description: "new-desc" }],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().description).toBe("new-desc");
	});

	test("Get product type", async () => {
		const productType = await productTypeDraft.create({
			name: "foo",
			description: "bar",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/product-types/${productType.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(productType);
	});
});
