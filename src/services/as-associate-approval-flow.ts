import type { FastifyInstance } from "fastify";
import { APPROVAL_FLOW_UPDATE_PERMISSION } from "#src/associate-permissions.ts";
import type { AsAssociateApprovalFlowRepository } from "#src/repositories/as-associate.ts";
import AbstractAssociateService, {
	type AssociateResourceRules,
} from "./abstract-associate.ts";

export class AsAssociateApprovalFlowService extends AbstractAssociateService {
	public repository: AsAssociateApprovalFlowRepository;

	// Approval flows have no view permission of their own: any associate of the
	// business unit may read them, and only updating is guarded
	protected rules: AssociateResourceRules = {
		update: [APPROVAL_FLOW_UPDATE_PERMISSION, APPROVAL_FLOW_UPDATE_PERMISSION],
		businessUnitWhere: (key) => `businessUnit(key="${key}")`,
		businessUnitOf: (flow) => flow.businessUnit?.key,
	};

	constructor(
		parent: FastifyInstance,
		repository: AsAssociateApprovalFlowRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "approval-flows";
	}
}
