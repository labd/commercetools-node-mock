import type {
	CustomerGroupChangeNameAction,
	CustomerGroupDraft,
	CustomerGroupSetCustomFieldAction,
	CustomerGroupSetCustomTypeAction,
	CustomerGroupSetKeyAction,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import { InMemoryStorage } from "~src/storage";
import { CustomerGroupRepository } from "./customer-group";

describe("CustomerGroup Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CustomerGroupRepository(config);

	// Add a custom type for testing
	storage.add("dummy", "type", {
		...getBaseResourceProperties(),
		id: "custom-type-id",
		key: "custom-type-key",
		name: { "en-US": "Custom Type" },
		resourceTypeIds: ["customer-group"],
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

	test("create customer group", () => {
		const draft: CustomerGroupDraft = {
			key: "premium-customers",
			groupName: "Premium Customers",
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.key).toBe(draft.key);
		expect(result.name).toBe(draft.groupName);
		expect(result.custom).toBeUndefined();

		// Test that the customer group is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
		expect(items.results[0].id).toBe(result.id);
	});

	test("create customer group with custom fields", () => {
		const draft: CustomerGroupDraft = {
			key: "vip-customers",
			groupName: "VIP Customers",
			custom: {
				type: {
					typeId: "type",
					id: "custom-type-id",
				},
				fields: {
					description: "Very important customers",
				},
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.name).toBe(draft.groupName);
		expect(result.custom).toBeDefined();
		expect(result.custom?.fields.description).toBe("Very important customers");
	});

	test("update customer group - changeName", () => {
		const draft: CustomerGroupDraft = {
			key: "test-customers",
			groupName: "Test Customers",
		};

		const ctx = { projectKey: "dummy" };
		const customerGroup = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			customerGroup,
			customerGroup.version,
			[
				{
					action: "changeName",
					name: "Updated Test Customers",
				} as CustomerGroupChangeNameAction,
			],
		);

		expect(result.name).toBe("Updated Test Customers");
		expect(result.version).toBe(customerGroup.version + 1);
	});

	test("update customer group - setKey", () => {
		const draft: CustomerGroupDraft = {
			key: "test-customers-2",
			groupName: "Test Customers 2",
		};

		const ctx = { projectKey: "dummy" };
		const customerGroup = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			customerGroup,
			customerGroup.version,
			[
				{
					action: "setKey",
					key: "new-customer-key",
				} as CustomerGroupSetKeyAction,
			],
		);

		expect(result.key).toBe("new-customer-key");
		expect(result.version).toBe(customerGroup.version + 1);
	});

	test("update customer group - setCustomType", () => {
		const draft: CustomerGroupDraft = {
			key: "test-customers-3",
			groupName: "Test Customers 3",
		};

		const ctx = { projectKey: "dummy" };
		const customerGroup = repository.create(ctx, draft);

		// Set custom type
		const result = repository.processUpdateActions(
			ctx,
			customerGroup,
			customerGroup.version,
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
				} as CustomerGroupSetCustomTypeAction,
			],
		);

		expect(result.custom).toBeDefined();
		expect(result.custom?.fields.description).toBe("New custom field value");
		expect(result.version).toBe(customerGroup.version + 1);

		// Remove custom type
		const result2 = repository.processUpdateActions(
			ctx,
			result,
			result.version,
			[
				{
					action: "setCustomType",
				} as CustomerGroupSetCustomTypeAction,
			],
		);

		expect(result2.custom).toBeUndefined();
		expect(result2.version).toBe(result.version + 1);
	});

	test("update customer group - setCustomField", () => {
		const draft: CustomerGroupDraft = {
			key: "test-customers-4",
			groupName: "Test Customers 4",
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
		const customerGroup = repository.create(ctx, draft);

		// Update custom field
		const result = repository.processUpdateActions(
			ctx,
			customerGroup,
			customerGroup.version,
			[
				{
					action: "setCustomField",
					name: "description",
					value: "Updated description",
				} as CustomerGroupSetCustomFieldAction,
			],
		);

		expect(result.custom?.fields.description).toBe("Updated description");
		expect(result.version).toBe(customerGroup.version + 1);

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
				} as CustomerGroupSetCustomFieldAction,
			],
		);

		expect(result2.custom?.fields.description).toBeUndefined();
		expect(result2.version).toBe(result.version + 1);
	});

	test("get and delete customer group", () => {
		const draft: CustomerGroupDraft = {
			key: "delete-test",
			groupName: "Delete Test",
		};

		const ctx = { projectKey: "dummy" };
		const customerGroup = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, customerGroup.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(customerGroup.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, customerGroup.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(customerGroup.key);

		// Test delete
		const deleted = repository.delete(ctx, customerGroup.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(customerGroup.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, customerGroup.id);
		expect(notFound).toBeNull();
	});
});
