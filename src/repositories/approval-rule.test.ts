import type {
	ApprovalRuleDraft,
	ApprovalRuleSetApproversAction,
	ApprovalRuleSetCustomFieldAction,
	ApprovalRuleSetCustomTypeAction,
	ApprovalRuleSetDescriptionAction,
	ApprovalRuleSetKeyAction,
	ApprovalRuleSetNameAction,
	ApprovalRuleSetPredicateAction,
	ApprovalRuleSetRequestersAction,
	ApprovalRuleSetStatusAction,
} from "@commercetools/platform-sdk";
import { beforeAll, describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { ApprovalRuleRepository } from "./approval-rule.ts";

type CreateDraft = ApprovalRuleDraft & {
	businessUnit?: { typeId: "business-unit"; key: string };
};

describe("ApprovalRule Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new ApprovalRuleRepository(config);
	const ctx = { projectKey: "dummy" };

	beforeAll(async () => {
		// Add required dependencies for testing
		await storage.add("dummy", "business-unit", {
			...getBaseResourceProperties(),
			id: "bu-123",
			key: "test-bu",
			name: "Test Business Unit",
			unitType: "Company",
			status: "Active",
			storeMode: "Explicit",
			associateMode: "Explicit",
			approvalRuleMode: "Explicit",
			addresses: [],
			associates: [],
			stores: [],
			topLevelUnit: { typeId: "business-unit", key: "test-bu" },
			shippingAddressIds: [],
			billingAddressIds: [],
		});

		await storage.add("dummy", "associate-role", {
			...getBaseResourceProperties(),
			id: "role-approver-1",
			key: "approver",
			name: "Approver",
			buyerAssignable: true,
			permissions: [],
		});

		await storage.add("dummy", "associate-role", {
			...getBaseResourceProperties(),
			id: "role-requester-1",
			key: "requester",
			name: "Requester",
			buyerAssignable: true,
			permissions: [],
		});

		await storage.add("dummy", "type", {
			...getBaseResourceProperties(),
			id: "type-123",
			key: "approval-rule-type",
			name: { "en-US": "Approval Rule Type" },
			resourceTypeIds: ["approval-rule"],
			fieldDefinitions: [
				{
					name: "comment",
					label: { "en-US": "Comment" },
					required: false,
					type: { name: "String" },
					inputHint: "SingleLine",
				},
			],
		});
	});

	test("create approval rule", async () => {
		const draft: CreateDraft = {
			key: "create-rule",
			name: "Big Orders",
			description: "Approval needed for big orders",
			status: "Active",
			predicate: 'totalPrice > "100 EUR"',
			approvers: {
				tiers: [
					{
						and: [
							{
								or: [
									{
										associateRole: {
											typeId: "associate-role",
											key: "approver",
										},
									},
								],
							},
						],
					},
				],
			},
			requesters: [
				{ associateRole: { typeId: "associate-role", key: "requester" } },
			],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const result = await repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.key).toBe(draft.key);
		expect(result.name).toBe(draft.name);
		expect(result.status).toBe("Active");
		expect(result.predicate).toBe(draft.predicate);
		expect(result.businessUnit).toEqual({
			typeId: "business-unit",
			key: "test-bu",
		});
		expect(result.approvers.tiers).toHaveLength(1);
		expect(result.approvers.tiers[0].and[0].or[0].associateRole.key).toBe(
			"approver",
		);
		expect(result.requesters[0].associateRole.key).toBe("requester");

		// Test that the approval rule is stored
		const items = await repository.query(ctx);
		expect(items.count).toBeGreaterThan(0);
		expect(items.results.some((r) => r.id === result.id)).toBe(true);
	});

	test("update approval rule - setName", async () => {
		const draft: CreateDraft = {
			key: "rename-rule",
			name: "Original Name",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setName",
					name: "New Name",
				} as ApprovalRuleSetNameAction,
			],
		);

		expect(result.name).toBe("New Name");
		expect(result.version).toBe(approvalRule.version + 1);
	});

	test("update approval rule - setDescription", async () => {
		const draft: CreateDraft = {
			key: "describe-rule",
			name: "Rule",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setDescription",
					description: "An approval rule",
				} as ApprovalRuleSetDescriptionAction,
			],
		);

		expect(result.description).toBe("An approval rule");
		expect(result.version).toBe(approvalRule.version + 1);
	});

	test("update approval rule - setKey", async () => {
		const draft: CreateDraft = {
			key: "key-original",
			name: "Rule",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setKey",
					key: "key-renamed",
				} as ApprovalRuleSetKeyAction,
			],
		);

		expect(result.key).toBe("key-renamed");
		expect(result.version).toBe(approvalRule.version + 1);
	});

	test("update approval rule - setPredicate", async () => {
		const draft: CreateDraft = {
			key: "predicate-rule",
			name: "Rule",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setPredicate",
					predicate: 'totalPrice > "500 EUR"',
				} as ApprovalRuleSetPredicateAction,
			],
		);

		expect(result.predicate).toBe('totalPrice > "500 EUR"');
		expect(result.version).toBe(approvalRule.version + 1);
	});

	test("update approval rule - setStatus", async () => {
		const draft: CreateDraft = {
			key: "status-rule",
			name: "Rule",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setStatus",
					status: "Inactive",
				} as ApprovalRuleSetStatusAction,
			],
		);

		expect(result.status).toBe("Inactive");
		expect(result.version).toBe(approvalRule.version + 1);
	});

	test("update approval rule - setApprovers", async () => {
		const draft: CreateDraft = {
			key: "approvers-rule",
			name: "Rule",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setApprovers",
					approvers: {
						tiers: [
							{
								and: [
									{
										or: [
											{
												associateRole: {
													typeId: "associate-role",
													key: "approver",
												},
											},
										],
									},
								],
							},
						],
					},
				} as ApprovalRuleSetApproversAction,
			],
		);

		expect(result.approvers.tiers).toHaveLength(1);
		expect(result.approvers.tiers[0].and[0].or[0].associateRole.key).toBe(
			"approver",
		);
		expect(result.version).toBe(approvalRule.version + 1);
	});

	test("update approval rule - setRequesters", async () => {
		const draft: CreateDraft = {
			key: "requesters-rule",
			name: "Rule",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setRequesters",
					requesters: [
						{ associateRole: { typeId: "associate-role", key: "requester" } },
					],
				} as ApprovalRuleSetRequestersAction,
			],
		);

		expect(result.requesters).toHaveLength(1);
		expect(result.requesters[0].associateRole.key).toBe("requester");
		expect(result.version).toBe(approvalRule.version + 1);
	});

	test("update approval rule - setCustomType and setCustomField", async () => {
		const draft: CreateDraft = {
			key: "custom-rule",
			name: "Rule",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		const withType = await repository.processUpdateActions(
			ctx,
			approvalRule,
			approvalRule.version,
			[
				{
					action: "setCustomType",
					type: { typeId: "type", id: "type-123" },
					fields: { comment: "needs review" },
				} as ApprovalRuleSetCustomTypeAction,
			],
		);

		expect(withType.custom?.fields.comment).toBe("needs review");
		expect(withType.version).toBe(approvalRule.version + 1);

		const withField = await repository.processUpdateActions(
			ctx,
			withType,
			withType.version,
			[
				{
					action: "setCustomField",
					name: "comment",
					value: "updated",
				} as ApprovalRuleSetCustomFieldAction,
			],
		);

		expect(withField.custom?.fields.comment).toBe("updated");
		expect(withField.version).toBe(withType.version + 1);
	});

	test("get and delete approval rule", async () => {
		const draft: CreateDraft = {
			key: "delete-rule",
			name: "Delete Test",
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "test-bu" },
		};

		const approvalRule = await repository.create(ctx, draft);

		// Test get
		const retrieved = await repository.get(ctx, approvalRule.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(approvalRule.id);

		// Test getByKey
		const retrievedByKey = await repository.getByKey(ctx, approvalRule.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(approvalRule.key);

		// Test delete
		const deleted = await repository.delete(ctx, approvalRule.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(approvalRule.id);

		// Verify it's deleted
		const notFound = await repository.get(ctx, approvalRule.id);
		expect(notFound).toBeNull();
	});
});
