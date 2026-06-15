import type {
	ApprovalFlow,
	ApprovalFlowApproveAction,
	ApprovalFlowRejectAction,
	ApprovalFlowSetCustomFieldAction,
	ApprovalFlowSetCustomTypeAction,
	ApprovalFlowUpdateAction,
	BusinessUnitKeyReference,
	OrderReference,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";

/**
 * Test-only draft for seeding ApprovalFlows. In commercetools, ApprovalFlows
 * are generated automatically when an Order matches an active ApprovalRule;
 * this draft exists so test fixtures can create them via the mock.
 */
export type ApprovalFlowDraft = {
	order: OrderReference;
	businessUnit: BusinessUnitKeyReference;
	status?: ApprovalFlow["status"];
	rules?: ApprovalFlow["rules"];
	approvals?: ApprovalFlow["approvals"];
	eligibleApprovers?: ApprovalFlow["eligibleApprovers"];
	pendingApprovers?: ApprovalFlow["pendingApprovers"];
	currentTierPendingApprovers?: ApprovalFlow["currentTierPendingApprovers"];
};

export class ApprovalFlowRepository extends AbstractResourceRepository<"approval-flow"> {
	constructor(config: Config) {
		super("approval-flow", config);
		this.actions = new ApprovalFlowUpdateHandler(this._storage);
	}

	async create(
		context: RepositoryContext,
		draft: ApprovalFlowDraft,
	): Promise<ApprovalFlow> {
		const resource: ApprovalFlow = {
			...getBaseResourceProperties(context.clientId),
			order: draft.order,
			businessUnit: draft.businessUnit,
			rules: draft.rules ?? [],
			status: draft.status ?? "Pending",
			approvals: draft.approvals ?? [],
			eligibleApprovers: draft.eligibleApprovers ?? [],
			pendingApprovers: draft.pendingApprovers ?? [],
			currentTierPendingApprovers: draft.currentTierPendingApprovers ?? [],
		};

		return await this.saveNew(context, resource);
	}
}

class ApprovalFlowUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<ApprovalFlow, ApprovalFlowUpdateAction>>
{
	approve(
		_context: RepositoryContext,
		resource: Writable<ApprovalFlow>,
		_action: ApprovalFlowApproveAction,
	) {
		resource.status = "Approved";
	}

	reject(
		context: RepositoryContext,
		resource: Writable<ApprovalFlow>,
		{ reason }: ApprovalFlowRejectAction,
	) {
		resource.status = "Rejected";
		resource.rejection = {
			rejecter: {
				customer: { typeId: "customer", id: context.associateId ?? "" },
				associateRoleAssignments: [],
			},
			rejectedAt: new Date().toISOString(),
			reason,
		};
	}

	setCustomField(
		_context: RepositoryContext,
		resource: Writable<ApprovalFlow>,
		{ name, value }: ApprovalFlowSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<ApprovalFlow>,
		{ type, fields }: ApprovalFlowSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}
}
