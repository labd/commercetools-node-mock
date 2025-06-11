import type { ExtensionDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

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
		const response = await supertest(ctMock.app)
			.post("/dummy/extensions")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/extensions")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/extensions/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/extensions")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/extensions/key=key-extension",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/extensions")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/extensions");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});
