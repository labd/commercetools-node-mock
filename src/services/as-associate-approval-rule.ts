import type { FastifyInstance } from "fastify";
import {
	APPROVAL_RULE_CREATE_PERMISSION,
	APPROVAL_RULE_UPDATE_PERMISSION,
} from "#src/associate-permissions.ts";
import type { AsAssociateApprovalRuleRepository } from "#src/repositories/as-associate.ts";
import AbstractAssociateService, {
	type AssociateResourceRules,
} from "./abstract-associate.ts";

export class AsAssociateApprovalRuleService extends AbstractAssociateService {
	public repository: AsAssociateApprovalRuleRepository;

	protected rules: AssociateResourceRules = {
		update: [APPROVAL_RULE_UPDATE_PERMISSION, APPROVAL_RULE_UPDATE_PERMISSION],
		createPermission: APPROVAL_RULE_CREATE_PERMISSION,
		businessUnitWhere: (key) => `businessUnit(key="${key}")`,
		businessUnitOf: (rule) => rule.businessUnit?.key,
		stampDraft: (draft, scope) => ({
			...draft,
			businessUnit: draft.businessUnit ?? {
				typeId: "business-unit",
				key: scope.businessUnitKey,
			},
		}),
	};

	constructor(
		parent: FastifyInstance,
		repository: AsAssociateApprovalRuleRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "approval-rules";
	}
}
