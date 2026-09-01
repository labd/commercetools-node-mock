import { describe, expect, test } from "vitest";
import { extensionDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Extension", () => {
	const extensionDraft = extensionDraftFactory(ctMock);

	test("Create extension", async () => {
		const draft = extensionDraft.build({
			key: "order-validation",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [
				{
					resourceTypeId: "order",
					actions: ["Create"],
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/extensions",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			id: expect.anything(),
			key: "order-validation",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			triggers: [
				{
					actions: ["Create"],
					resourceTypeId: "order",
				},
			],
			version: 1,
		});
	});

	test("Create extension with expansion paths", async () => {
		const draft = extensionDraft.build({
			key: "cart-expansion",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [
				{
					resourceTypeId: "cart",
					actions: ["Create"],
				},
			],
			expansionPaths: ["lineItems[*].variant"],
			additionalContext: { includeOldResource: true },
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/extensions",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().expansionPaths).toEqual(["lineItems[*].variant"]);
		expect(response.json().additionalContext).toEqual({
			includeOldResource: true,
		});

		const updated = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/extensions/${response.json().id}`,
			payload: {
				version: response.json().version,
				actions: [
					{
						action: "setExpansionPaths",
						expansionPaths: ["custom.type", "shippingInfo.shippingMethod"],
					},
				],
			},
		});

		expect(updated.statusCode).toBe(200);
		expect(updated.json().expansionPaths).toEqual([
			"custom.type",
			"shippingInfo.shippingMethod",
		]);
	});

	test("Get extension", async () => {
		const extension = await extensionDraft.create({
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://test.example.com/webhook",
			},
			triggers: [
				{
					resourceTypeId: "customer",
					actions: ["Update"],
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/extensions/${extension.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(extension);
	});

	test("Get extension by key", async () => {
		const extension = await extensionDraft.create({
			key: "key-extension",
			destination: {
				type: "HTTP",
				url: "https://key.example.com/webhook",
			},
			triggers: [
				{
					resourceTypeId: "cart",
					actions: ["Create", "Update"],
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/extensions/key=key-extension",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(extension);
	});

	test("Query extensions", async () => {
		const extension = await extensionDraft.create({
			key: "query-extension",
			destination: {
				type: "HTTP",
				url: "https://query.example.com/webhook",
			},
			triggers: [
				{
					resourceTypeId: "product",
					actions: ["Delete"],
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/extensions",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(extension);
	});
});
