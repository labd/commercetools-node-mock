import type { ExtensionDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Extension", () => {
	test("Create extension", async () => {
		const draft: ExtensionDraft = {
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
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/extensions",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			id: expect.anything(),
			key: "order-validation",
			lastModifiedAt: expect.anything(),
			triggers: [
				{
					actions: ["Create"],
					resourceTypeId: "order",
				},
			],
			version: 1,
		});
	});

	test("Get extension", async () => {
		const draft: ExtensionDraft = {
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
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/extensions",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/extensions/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get extension by key", async () => {
		const draft: ExtensionDraft = {
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
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/extensions",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/extensions/key=key-extension",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query extensions", async () => {
		const draft: ExtensionDraft = {
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
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/extensions",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/extensions",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});
});
