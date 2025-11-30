import type { ZoneDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
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
		const response = await supertest(ctMock.app)
			.post("/dummy/zones")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/zones")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/zones/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/zones")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/zones/key=key-zone",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/zones")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/zones");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});
