import type {
	ApprovalFlowApproveAction,
	ApprovalFlowRejectAction,
	ApprovalFlowSetCustomFieldAction,
	ApprovalFlowSetCustomTypeAction,
} from "@commercetools/platform-sdk";
import { beforeAll, describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import {
	ApprovalFlowRepository,
	type ApprovalFlowDraft,
} from "./approval-flow.ts";

describe("ApprovalFlow Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new ApprovalFlowRepository(config);

	beforeAll(async () => {
		// Add required dependencies for testing
		await storage.add("dummy", "type", {
			...getBaseResourceProperties(),
			id: "type-123",
			key: "approval-flow-type",
			name: { "en-US": "Approval Flow Type" },
			resourceTypeIds: ["approval-flow"],
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

	test("create approval flow", async () => {
		const draft: ApprovalFlowDraft = {
			order: { typeId: "order", id: "order-create" },
			businessUnit: { typeId: "business-unit", key: "bu-create" },
		};

		const ctx = { projectKey: "dummy" };
		const result = await repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.status).toBe("Pending");
		expect(result.order.id).toBe("order-create");
		expect(result.businessUnit.key).toBe("bu-create");
		expect(result.rules).toEqual([]);
		expect(result.approvals).toEqual([]);

		// Test that the approval flow is stored
		const items = await repository.query(ctx);
		expect(items.count).toBeGreaterThan(0);
		expect(items.results.some((r) => r.id === result.id)).toBe(true);
	});

	test("create approval flow with minimal data", async () => {
		const draft: ApprovalFlowDraft = {
			order: { typeId: "order", id: "order-minimal" },
			businessUnit: { typeId: "business-unit", key: "bu-minimal" },
		};

		const ctx = { projectKey: "dummy" };
		const result = await repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.status).toBe("Pending");
		expect(result.rules).toEqual([]);
		expect(result.eligibleApprovers).toEqual([]);
		expect(result.pendingApprovers).toEqual([]);
		expect(result.currentTierPendingApprovers).toEqual([]);
		expect(result.custom).toBeUndefined();
	});

	test("update approval flow - approve", async () => {
		const draft: ApprovalFlowDraft = {
			order: { typeId: "order", id: "order-approve" },
			businessUnit: { typeId: "business-unit", key: "bu-approve" },
		};

		const ctx = { projectKey: "dummy" };
		const approvalFlow = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalFlow,
			approvalFlow.version,
			[{ action: "approve" } as ApprovalFlowApproveAction],
		);

		expect(result.status).toBe("Approved");
		expect(result.version).toBe(approvalFlow.version + 1);
	});

	test("update approval flow - reject", async () => {
		const draft: ApprovalFlowDraft = {
			order: { typeId: "order", id: "order-reject" },
			businessUnit: { typeId: "business-unit", key: "bu-reject" },
		};

		const ctx = { projectKey: "dummy", associateId: "associate-123" };
		const approvalFlow = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
			ctx,
			approvalFlow,
			approvalFlow.version,
			[
				{
					action: "reject",
					reason: "Over budget",
				} as ApprovalFlowRejectAction,
			],
		);

		expect(result.status).toBe("Rejected");
		expect(result.rejection?.reason).toBe("Over budget");
		expect(result.rejection?.rejecter.customer).toEqual({
			typeId: "customer",
			id: "associate-123",
		});
		expect(result.version).toBe(approvalFlow.version + 1);
	});

	test("update approval flow - setCustomType", async () => {
		const draft: ApprovalFlowDraft = {
			order: { typeId: "order", id: "order-custom-type" },
			businessUnit: { typeId: "business-unit", key: "bu-custom-type" },
		};

		const ctx = { projectKey: "dummy" };
		const approvalFlow = await repository.create(ctx, draft);

		// Set custom type
		const result = await repository.processUpdateActions(
			ctx,
			approvalFlow,
			approvalFlow.version,
			[
				{
					action: "setCustomType",
					type: { typeId: "type", id: "type-123" },
					fields: { comment: "needs review" },
				} as ApprovalFlowSetCustomTypeAction,
			],
		);

		expect(result.custom).toBeDefined();
		expect(result.custom?.fields.comment).toBe("needs review");
		expect(result.version).toBe(approvalFlow.version + 1);

		// Remove custom type
		const result2 = await repository.processUpdateActions(
			ctx,
			result,
			result.version,
			[{ action: "setCustomType" } as ApprovalFlowSetCustomTypeAction],
		);

		expect(result2.custom).toBeUndefined();
		expect(result2.version).toBe(result.version + 1);
	});

	test("update approval flow - setCustomField", async () => {
		const draft: ApprovalFlowDraft = {
			order: { typeId: "order", id: "order-custom-field" },
			businessUnit: { typeId: "business-unit", key: "bu-custom-field" },
		};

		const ctx = { projectKey: "dummy" };
		const approvalFlow = await repository.create(ctx, draft);

		// First attach a custom type
		const withType = await repository.processUpdateActions(
			ctx,
			approvalFlow,
			approvalFlow.version,
			[
				{
					action: "setCustomType",
					type: { typeId: "type", id: "type-123" },
					fields: { comment: "initial" },
				} as ApprovalFlowSetCustomTypeAction,
			],
		);

		const result = await repository.processUpdateActions(
			ctx,
			withType,
			withType.version,
			[
				{
					action: "setCustomField",
					name: "comment",
					value: "updated",
				} as ApprovalFlowSetCustomFieldAction,
			],
		);

		expect(result.custom?.fields.comment).toBe("updated");
		expect(result.version).toBe(withType.version + 1);
	});

	test("get and delete approval flow", async () => {
		const draft: ApprovalFlowDraft = {
			order: { typeId: "order", id: "order-delete" },
			businessUnit: { typeId: "business-unit", key: "bu-delete" },
		};

		const ctx = { projectKey: "dummy" };
		const approvalFlow = await repository.create(ctx, draft);

		// Test get
		const retrieved = await repository.get(ctx, approvalFlow.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(approvalFlow.id);

		// Test delete
		const deleted = await repository.delete(ctx, approvalFlow.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(approvalFlow.id);

		// Verify it's deleted
		const notFound = await repository.get(ctx, approvalFlow.id);
		expect(notFound).toBeNull();
	});
});
