import type {
	ZoneAddLocationAction,
	ZoneChangeNameAction,
	ZoneDraft,
	ZoneRemoveLocationAction,
	ZoneSetDescriptionAction,
	ZoneSetKeyAction,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { ZoneRepository } from "./zone";

describe("Zone Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new ZoneRepository(config);

	test("create zone", () => {
		const draft: ZoneDraft = {
			key: "europe-zone",
			name: "Europe Zone",
			description: "European countries zone",
			locations: [
				{
					country: "DE",
				},
				{
					country: "FR",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.key).toBe(draft.key);
		expect(result.name).toBe(draft.name);
		expect(result.description).toBe(draft.description);
		expect(result.locations).toEqual(draft.locations);

		// Test that the zone is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
		expect(items.results[0].id).toBe(result.id);
	});

	test("create zone without optional fields", () => {
		const draft: ZoneDraft = {
			name: "Simple Zone",
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.name).toBe(draft.name);
		expect(result.key).toBeUndefined();
		expect(result.description).toBeUndefined();
		expect(result.locations).toEqual([]);
	});

	test("update zone - changeName", () => {
		const draft: ZoneDraft = {
			key: "test-zone",
			name: "Test Zone",
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, zone, zone.version, [
			{
				action: "changeName",
				name: "Updated Test Zone",
			} as ZoneChangeNameAction,
		]);

		expect(result.name).toBe("Updated Test Zone");
		expect(result.version).toBe(zone.version + 1);
	});

	test("update zone - setKey", () => {
		const draft: ZoneDraft = {
			key: "test-zone-2",
			name: "Test Zone 2",
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, zone, zone.version, [
			{
				action: "setKey",
				key: "new-zone-key",
			} as ZoneSetKeyAction,
		]);

		expect(result.key).toBe("new-zone-key");
		expect(result.version).toBe(zone.version + 1);
	});

	test("update zone - setDescription", () => {
		const draft: ZoneDraft = {
			key: "test-zone-3",
			name: "Test Zone 3",
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, zone, zone.version, [
			{
				action: "setDescription",
				description: "New zone description",
			} as ZoneSetDescriptionAction,
		]);

		expect(result.description).toBe("New zone description");
		expect(result.version).toBe(zone.version + 1);
	});

	test("update zone - addLocation", () => {
		const draft: ZoneDraft = {
			key: "test-zone-4",
			name: "Test Zone 4",
			locations: [
				{
					country: "DE",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, zone, zone.version, [
			{
				action: "addLocation",
				location: {
					country: "FR",
				},
			} as ZoneAddLocationAction,
		]);

		expect(result.locations).toHaveLength(2);
		expect(result.locations).toContainEqual({ country: "DE" });
		expect(result.locations).toContainEqual({ country: "FR" });
		expect(result.version).toBe(zone.version + 1);
	});

	test("update zone - addLocation with state", () => {
		const draft: ZoneDraft = {
			key: "test-zone-5",
			name: "Test Zone 5",
			locations: [],
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, zone, zone.version, [
			{
				action: "addLocation",
				location: {
					country: "US",
					state: "CA",
				},
			} as ZoneAddLocationAction,
		]);

		expect(result.locations).toHaveLength(1);
		expect(result.locations[0]).toEqual({ country: "US", state: "CA" });
		expect(result.version).toBe(zone.version + 1);
	});

	test("update zone - removeLocation", () => {
		const draft: ZoneDraft = {
			key: "test-zone-6",
			name: "Test Zone 6",
			locations: [
				{
					country: "DE",
				},
				{
					country: "FR",
				},
				{
					country: "US",
					state: "CA",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, zone, zone.version, [
			{
				action: "removeLocation",
				location: {
					country: "FR",
				},
			} as ZoneRemoveLocationAction,
		]);

		expect(result.locations).toHaveLength(2);
		expect(result.locations).toContainEqual({ country: "DE" });
		expect(result.locations).toContainEqual({ country: "US", state: "CA" });
		expect(result.locations).not.toContainEqual({ country: "FR" });
		expect(result.version).toBe(zone.version + 1);
	});

	test("update zone - removeLocation with state", () => {
		const draft: ZoneDraft = {
			key: "test-zone-7",
			name: "Test Zone 7",
			locations: [
				{
					country: "US",
					state: "CA",
				},
				{
					country: "US",
					state: "NY",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, zone, zone.version, [
			{
				action: "removeLocation",
				location: {
					country: "US",
					state: "CA",
				},
			} as ZoneRemoveLocationAction,
		]);

		expect(result.locations).toHaveLength(1);
		expect(result.locations[0]).toEqual({ country: "US", state: "NY" });
		expect(result.version).toBe(zone.version + 1);
	});

	test("get and delete zone", () => {
		const draft: ZoneDraft = {
			key: "delete-test",
			name: "Delete Test Zone",
		};

		const ctx = { projectKey: "dummy" };
		const zone = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, zone.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(zone.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, zone.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(zone.key);

		// Test delete
		const deleted = repository.delete(ctx, zone.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(zone.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, zone.id);
		expect(notFound).toBeNull();
	});
});
