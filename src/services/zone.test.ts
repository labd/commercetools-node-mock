import { describe, expect, test } from "vitest";
import { zoneDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Zone", () => {
	const zoneDraft = zoneDraftFactory(ctMock);

	test("Create zone", async () => {
		const draft = zoneDraft.build({
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
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			description: undefined,
			id: expect.anything(),
			key: "europe-zone",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
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
		const zone = await zoneDraft.create({
			key: "test-zone",
			name: "Test Zone",
			locations: [
				{
					country: "US",
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/zones/${zone.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(zone);
	});

	test("Get zone by key", async () => {
		const zone = await zoneDraft.create({
			key: "key-zone",
			name: "Key Zone",
			locations: [
				{
					country: "CA",
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/zones/key=key-zone",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(zone);
	});

	test("Query zones", async () => {
		const zone = await zoneDraft.create({
			key: "query-zone",
			name: "Query Zone",
			locations: [
				{
					country: "FR",
				},
			],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/zones",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.count).toBeGreaterThan(0);
		expect(body.results).toContainEqual(zone);
	});
});
