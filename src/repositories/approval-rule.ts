import type {
	ApprovalRule,
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
	ApprovalRuleUpdateAction,
	ApproverConjunctionDraft,
	ApproverHierarchy,
	ApproverHierarchyDraft,
	RuleRequester,
	RuleRequesterDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { AbstractStorage } from "../storage/index.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";
import {
	createCustomFields,
	getAssociateRoleKeyReference,
	getBusinessUnitKeyReference,
} from "./helpers.ts";

const resolveApproverHierarchy = async (
	draft: ApproverHierarchyDraft,
	projectKey: string,
	storage: AbstractStorage,
): Promise<ApproverHierarchy> => ({
	tiers: await Promise.all(
		draft.tiers.map(async (tier: ApproverConjunctionDraft) => ({
			and: await Promise.all(
				tier.and.map(async (disjunction) => ({
					or: await Promise.all(
						disjunction.or.map(async (approver) => ({
							associateRole: await getAssociateRoleKeyReference(
								approver.associateRole,
								projectKey,
								storage,
							),
						})),
					),
				})),
			),
		})),
	),
});

const resolveRequesters = async (
	drafts: RuleRequesterDraft[],
	projectKey: string,
	storage: AbstractStorage,
): Promise<RuleRequester[]> =>
	Promise.all(
		drafts.map(async (requester) => ({
			associateRole: await getAssociateRoleKeyReference(
				requester.associateRole,
				projectKey,
				storage,
			),
		})),
	);

export class ApprovalRuleRepository extends AbstractResourceRepository<"approval-rule"> {
	constructor(config: Config) {
		super("approval-rule", config);
		this.actions = new ApprovalRuleUpdateHandler(this._storage);
	}

	async create(
		context: RepositoryContext,
		draft: ApprovalRuleDraft & {
			businessUnit?: { typeId: "business-unit"; key: string };
		},
	): Promise<ApprovalRule> {
		const businessUnitKey =
			(draft as any).businessUnit?.key ?? context.businessUnitKey;
		if (!businessUnitKey) {
			throw new Error(
				"ApprovalRule requires a businessUnit. Provide it either via the request path (as-associate route) or in the draft for direct creation.",
			);
		}

		const businessUnit = await getBusinessUnitKeyReference(
			{ typeId: "business-unit", key: businessUnitKey },
			context.projectKey,
			this._storage,
		);

		const resource: ApprovalRule = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.name,
			description: draft.description,
			status: draft.status,
			predicate: draft.predicate,
			approvers: await resolveApproverHierarchy(
				draft.approvers,
				context.projectKey,
				this._storage,
			),
			requesters: await resolveRequesters(
				draft.requesters,
				context.projectKey,
				this._storage,
			),
			businessUnit,
			custom: await createCustomFields(
				(draft as any).custom,
				context.projectKey,
				this._storage,
			),
		};

		return await this.saveNew(context, resource);
	}
}

class ApprovalRuleUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<ApprovalRule, ApprovalRuleUpdateAction>>
{
	async setApprovers(
		context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ approvers }: ApprovalRuleSetApproversAction,
	) {
		resource.approvers = await resolveApproverHierarchy(
			approvers,
			context.projectKey,
			this._storage,
		);
	}

	setCustomField(
		_context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ name, value }: ApprovalRuleSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ type, fields }: ApprovalRuleSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	setDescription(
		_context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ description }: ApprovalRuleSetDescriptionAction,
	) {
		resource.description = description;
	}

	setKey(
		_context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ key }: ApprovalRuleSetKeyAction,
	) {
		resource.key = key;
	}

	setName(
		_context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ name }: ApprovalRuleSetNameAction,
	) {
		resource.name = name;
	}

	setPredicate(
		_context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ predicate }: ApprovalRuleSetPredicateAction,
	) {
		resource.predicate = predicate;
	}

	async setRequesters(
		context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ requesters }: ApprovalRuleSetRequestersAction,
	) {
		resource.requesters = await resolveRequesters(
			requesters,
			context.projectKey,
			this._storage,
		);
	}

	setStatus(
		_context: RepositoryContext,
		resource: Writable<ApprovalRule>,
		{ status }: ApprovalRuleSetStatusAction,
	) {
		resource.status = status;
	}
}
