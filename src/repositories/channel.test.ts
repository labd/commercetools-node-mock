import type {
	ChannelChangeDescriptionAction,
	ChannelChangeKeyAction,
	ChannelChangeNameAction,
	ChannelDraft,
	ChannelSetAddressAction,
	ChannelSetCustomFieldAction,
	ChannelSetCustomTypeAction,
	ChannelSetGeoLocationAction,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { ChannelRepository } from "./channel.ts";

describe("Channel Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new ChannelRepository(config);

	// Add a custom type for testing
	storage.add("dummy", "type", {
		...getBaseResourceProperties(),
		id: "custom-type-id",
		key: "custom-type-key",
		name: { "en-US": "Custom Type" },
		resourceTypeIds: ["channel"],
		fieldDefinitions: [
			{
				name: "description",
				label: { "en-US": "Description" },
				required: false,
				type: { name: "String" },
				inputHint: "SingleLine",
			},
		],
	});

	test("create channel", () => {
		const draft: ChannelDraft = {
			key: "distribution-center-1",
			name: { "en-US": "Distribution Center 1" },
			description: { "en-US": "Main distribution center" },
			roles: ["InventorySupply", "OrderExport"],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.key).toBe(draft.key);
		expect(result.name).toEqual(draft.name);
		expect(result.description).toEqual(draft.description);
		expect(result.roles).toEqual(draft.roles);
		expect(result.geoLocation).toBeUndefined();
		expect(result.address).toBeUndefined();
		expect(result.custom).toBeUndefined();

		// Test that the channel is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
		expect(items.results[0].id).toBe(result.id);
	});

	test("create channel with all optional fields", () => {
		const draft: ChannelDraft = {
			key: "store-berlin",
			name: { "en-US": "Berlin Store", "de-DE": "Berlin Geschäft" },
			description: { "en-US": "Store in Berlin" },
			roles: ["ProductDistribution"],
			address: {
				country: "DE",
				city: "Berlin",
				streetName: "Hauptstraße",
				streetNumber: "123",
				postalCode: "10115",
			},
			geoLocation: {
				type: "Point",
				coordinates: [13.405, 52.52],
			},
			custom: {
				type: {
					typeId: "type",
					id: "custom-type-id",
				},
				fields: {
					description: "Custom description",
				},
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.name).toEqual(draft.name);
		expect(result.address?.country).toBe("DE");
		expect(result.address?.city).toBe("Berlin");
		expect(result.geoLocation).toEqual(draft.geoLocation);
		expect(result.custom?.fields.description).toBe("Custom description");
	});

	test("update channel - changeName", () => {
		const draft: ChannelDraft = {
			key: "test-channel",
			name: { "en-US": "Test Channel" },
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			channel,
			channel.version,
			[
				{
					action: "changeName",
					name: { "en-US": "Updated Test Channel" },
				} as ChannelChangeNameAction,
			],
		);

		expect(result.name).toEqual({ "en-US": "Updated Test Channel" });
		expect(result.version).toBe(channel.version + 1);
	});

	test("update channel - changeKey", () => {
		const draft: ChannelDraft = {
			key: "test-channel-2",
			name: { "en-US": "Test Channel 2" },
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			channel,
			channel.version,
			[
				{
					action: "changeKey",
					key: "new-channel-key",
				} as ChannelChangeKeyAction,
			],
		);

		expect(result.key).toBe("new-channel-key");
		expect(result.version).toBe(channel.version + 1);
	});

	test("update channel - changeDescription", () => {
		const draft: ChannelDraft = {
			key: "test-channel-3",
			name: { "en-US": "Test Channel 3" },
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			channel,
			channel.version,
			[
				{
					action: "changeDescription",
					description: { "en-US": "New description" },
				} as ChannelChangeDescriptionAction,
			],
		);

		expect(result.description).toEqual({ "en-US": "New description" });
		expect(result.version).toBe(channel.version + 1);
	});

	test("update channel - setAddress", () => {
		const draft: ChannelDraft = {
			key: "test-channel-4",
			name: { "en-US": "Test Channel 4" },
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			channel,
			channel.version,
			[
				{
					action: "setAddress",
					address: {
						country: "US",
						city: "New York",
						streetName: "Broadway",
						streetNumber: "123",
						postalCode: "10001",
					},
				} as ChannelSetAddressAction,
			],
		);

		expect(result.address?.country).toBe("US");
		expect(result.address?.city).toBe("New York");
		expect(result.version).toBe(channel.version + 1);
	});

	test("update channel - setGeoLocation", () => {
		const draft: ChannelDraft = {
			key: "test-channel-5",
			name: { "en-US": "Test Channel 5" },
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			channel,
			channel.version,
			[
				{
					action: "setGeoLocation",
					geoLocation: {
						type: "Point",
						coordinates: [2.3522, 48.8566], // Paris coordinates
					},
				} as ChannelSetGeoLocationAction,
			],
		);

		expect(result.geoLocation).toEqual({
			type: "Point",
			coordinates: [2.3522, 48.8566],
		});
		expect(result.version).toBe(channel.version + 1);
	});

	test("update channel - setCustomType", () => {
		const draft: ChannelDraft = {
			key: "test-channel-6",
			name: { "en-US": "Test Channel 6" },
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		// Set custom type
		const result = repository.processUpdateActions(
			ctx,
			channel,
			channel.version,
			[
				{
					action: "setCustomType",
					type: {
						typeId: "type",
						id: "custom-type-id",
					},
					fields: {
						description: "New custom field value",
					},
				} as ChannelSetCustomTypeAction,
			],
		);

		expect(result.custom).toBeDefined();
		expect(result.custom?.fields.description).toBe("New custom field value");
		expect(result.version).toBe(channel.version + 1);

		// Remove custom type
		const result2 = repository.processUpdateActions(
			ctx,
			result,
			result.version,
			[
				{
					action: "setCustomType",
				} as ChannelSetCustomTypeAction,
			],
		);

		expect(result2.custom).toBeUndefined();
		expect(result2.version).toBe(result.version + 1);
	});

	test("update channel - setCustomField", () => {
		const draft: ChannelDraft = {
			key: "test-channel-7",
			name: { "en-US": "Test Channel 7" },
			custom: {
				type: {
					typeId: "type",
					id: "custom-type-id",
				},
				fields: {
					description: "Initial description",
				},
			},
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		// Update custom field
		const result = repository.processUpdateActions(
			ctx,
			channel,
			channel.version,
			[
				{
					action: "setCustomField",
					name: "description",
					value: "Updated description",
				} as ChannelSetCustomFieldAction,
			],
		);

		expect(result.custom?.fields.description).toBe("Updated description");
		expect(result.version).toBe(channel.version + 1);

		// Remove custom field
		const result2 = repository.processUpdateActions(
			ctx,
			result,
			result.version,
			[
				{
					action: "setCustomField",
					name: "description",
					value: null,
				} as ChannelSetCustomFieldAction,
			],
		);

		expect(result2.custom?.fields.description).toBeUndefined();
		expect(result2.version).toBe(result.version + 1);
	});

	test("get and delete channel", () => {
		const draft: ChannelDraft = {
			key: "delete-test",
			name: { "en-US": "Delete Test Channel" },
		};

		const ctx = { projectKey: "dummy" };
		const channel = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, channel.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(channel.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, channel.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(channel.key);

		// Test delete
		const deleted = repository.delete(ctx, channel.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(channel.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, channel.id);
		expect(notFound).toBeNull();
	});
});
