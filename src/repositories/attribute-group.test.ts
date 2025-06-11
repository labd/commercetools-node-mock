import type {
	AttributeGroupChangeNameAction,
	AttributeGroupDraft,
	AttributeGroupSetAttributesAction,
	AttributeGroupSetDescriptionAction,
	AttributeGroupSetKeyAction,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { AttributeGroupRepository } from "./attribute-group";

describe("AttributeGroup Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new AttributeGroupRepository(config);

	test("create attribute group", () => {
		const draft: AttributeGroupDraft = {
			name: { "en-US": "Size Attributes", "de-DE": "Größenattribute" },
			description: { "en-US": "Attributes related to product size" },
			key: "size-attributes",
			attributes: [
				{
					key: "size",
				},
				{
					key: "weight",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.name).toEqual(draft.name);
		expect(result.description).toEqual(draft.description);
		expect(result.key).toBe(draft.key);
		expect(result.attributes).toEqual(draft.attributes);

		// Test that the attribute group is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
		expect(items.results[0].id).toBe(result.id);
	});

	test("create attribute group with minimal data", () => {
		const draft: AttributeGroupDraft = {
			name: { "en-US": "Minimal Attributes" },
			attributes: [],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.name).toEqual(draft.name);
		expect(result.description).toBeUndefined();
		expect(result.key).toBeUndefined();
		expect(result.attributes).toEqual([]);
	});

	test("update attribute group - changeName", () => {
		const draft: AttributeGroupDraft = {
			name: { "en-US": "Original Name" },
			key: "test-attributes",
			attributes: [],
		};

		const ctx = { projectKey: "dummy" };
		const attributeGroup = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			attributeGroup,
			attributeGroup.version,
			[
				{
					action: "changeName",
					name: { "en-US": "Updated Name", "de-DE": "Aktualisierter Name" },
				} as AttributeGroupChangeNameAction,
			],
		);

		expect(result.name).toEqual({
			"en-US": "Updated Name",
			"de-DE": "Aktualisierter Name",
		});
		expect(result.version).toBe(attributeGroup.version + 1);
	});

	test("update attribute group - setDescription", () => {
		const draft: AttributeGroupDraft = {
			name: { "en-US": "Test Attributes" },
			key: "test-attributes-2",
			attributes: [],
		};

		const ctx = { projectKey: "dummy" };
		const attributeGroup = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			attributeGroup,
			attributeGroup.version,
			[
				{
					action: "setDescription",
					description: {
						"en-US": "New description",
						"de-DE": "Neue Beschreibung",
					},
				} as AttributeGroupSetDescriptionAction,
			],
		);

		expect(result.description).toEqual({
			"en-US": "New description",
			"de-DE": "Neue Beschreibung",
		});
		expect(result.version).toBe(attributeGroup.version + 1);
	});

	test("update attribute group - setKey", () => {
		const draft: AttributeGroupDraft = {
			name: { "en-US": "Key Test Attributes" },
			key: "original-key",
			attributes: [],
		};

		const ctx = { projectKey: "dummy" };
		const attributeGroup = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			attributeGroup,
			attributeGroup.version,
			[
				{
					action: "setKey",
					key: "updated-key",
				} as AttributeGroupSetKeyAction,
			],
		);

		expect(result.key).toBe("updated-key");
		expect(result.version).toBe(attributeGroup.version + 1);
	});

	test("update attribute group - setAttributes", () => {
		const draft: AttributeGroupDraft = {
			name: { "en-US": "Attributes Test" },
			key: "attributes-test",
			attributes: [
				{
					key: "original-attribute",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const attributeGroup = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			attributeGroup,
			attributeGroup.version,
			[
				{
					action: "setAttributes",
					attributes: [
						{
							key: "new-attribute-1",
						},
						{
							key: "new-attribute-2",
						},
					],
				} as AttributeGroupSetAttributesAction,
			],
		);

		expect(result.attributes).toEqual([
			{ key: "new-attribute-1" },
			{ key: "new-attribute-2" },
		]);
		expect(result.version).toBe(attributeGroup.version + 1);
	});

	test("get and delete attribute group", () => {
		const draft: AttributeGroupDraft = {
			name: { "en-US": "Delete Test Attributes" },
			key: "delete-test",
			attributes: [],
		};

		const ctx = { projectKey: "dummy" };
		const attributeGroup = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, attributeGroup.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(attributeGroup.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, attributeGroup.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(attributeGroup.key);

		// Test delete
		const deleted = repository.delete(ctx, attributeGroup.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(attributeGroup.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, attributeGroup.id);
		expect(notFound).toBeNull();
	});
});
