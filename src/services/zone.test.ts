import type { ZoneDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Zone", () => {
	test("Create zone", async () => {
		const draft: ZoneDraft = {
			key: "europe-zone",
			name: "Europe",
			locations: [
				{
					country: "DE",
				},
				{
					country: "NL",
				},
			],
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			description: undefined,
			id: expect.anything(),
			key: "europe-zone",
			lastModifiedAt: expect.anything(),
			locations: [
				{
					country: "DE",
				},
				{
					country: "NL",
				},
			],
			name: "Europe",
			version: 1,
		});
	});

	test("Get zone", async () => {
		const draft: ZoneDraft = {
			key: "test-zone",
			name: "Test Zone",
			locations: [
				{
					country: "US",
				},
			],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/zones/${createBody.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
	});

	test("Get zone by key", async () => {
		const draft: ZoneDraft = {
			key: "key-zone",
			name: "Key Zone",
			locations: [
				{
					country: "CA",
				},
			],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/zones/key=key-zone",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
	});

	test("Query zones", async () => {
		const draft: ZoneDraft = {
			key: "query-zone",
			name: "Query Zone",
			locations: [
				{
					country: "FR",
				},
			],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/zones",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.count).toBeGreaterThan(0);
		expect(body.results).toContainEqual(createBody);
	});
});
