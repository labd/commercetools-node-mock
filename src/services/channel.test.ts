import { describe, expect, test } from "vitest";
import { channelDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Channel", () => {
	const channelDraft = channelDraftFactory(ctMock);

	test("Create channel", async () => {
		const draft = channelDraft.build({
			key: "my-channel",
			roles: ["InventorySupply"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/channels",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			address: undefined,
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			custom: undefined,
			description: undefined,
			geoLocation: undefined,
			id: expect.anything(),
			key: "my-channel",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			name: undefined,
			roles: ["InventorySupply"],
			version: 1,
		});
	});

	test("Get channel", async () => {
		const channel = await channelDraft.create({
			key: "my-channel",
			roles: ["InventorySupply"],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/channels/${channel.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(channel);
	});

	test("Get channel by key", async () => {
		const channel = await channelDraft.create({
			key: "my-channel-key",
			roles: ["InventorySupply"],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/channels/key=my-channel-key",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(channel);
	});

	test("Query channels", async () => {
		const channel = await channelDraft.create({
			key: "test-channel",
			roles: ["InventorySupply"],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/channels",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(channel);
	});
});
