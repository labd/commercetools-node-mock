import type { ChannelDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

const ctMock = new CommercetoolsMock();

describe("Channel", () => {
	test("Create channel", async () => {
		const draft: ChannelDraft = {
			key: "my-channel",
			roles: ["InventorySupply"],
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/channels")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
			address: undefined,
			createdAt: expect.anything(),
			custom: undefined,
			description: undefined,
			geoLocation: undefined,
			id: expect.anything(),
			key: "my-channel",
			lastModifiedAt: expect.anything(),
			name: undefined,
			roles: ["InventorySupply"],
			version: 1,
		});
	});

	test("Get channel", async () => {
		const draft: ChannelDraft = {
			key: "my-channel",
			roles: ["InventorySupply"],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/channels")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/channels/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Get channel by key", async () => {
		const draft: ChannelDraft = {
			key: "my-channel-key",
			roles: ["InventorySupply"],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/channels")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/channels/key=my-channel-key",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Query channels", async () => {
		const draft: ChannelDraft = {
			key: "test-channel",
			roles: ["InventorySupply"],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/channels")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/channels");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});
