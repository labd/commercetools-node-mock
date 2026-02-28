import type { ChannelDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Channel", () => {
	test("Create channel", async () => {
		const draft: ChannelDraft = {
			key: "my-channel",
			roles: ["InventorySupply"],
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/channels",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
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
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/channels",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/channels/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get channel by key", async () => {
		const draft: ChannelDraft = {
			key: "my-channel-key",
			roles: ["InventorySupply"],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/channels",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/channels/key=my-channel-key",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query channels", async () => {
		const draft: ChannelDraft = {
			key: "test-channel",
			roles: ["InventorySupply"],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/channels",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/channels",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});
});
