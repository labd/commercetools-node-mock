import type { FastifyInstance } from "fastify";
import type { AsAssociateApprovalRuleRepository } from "#src/repositories/as-associate.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateApprovalRuleService extends AbstractService {
	public repository: AsAssociateApprovalRuleRepository;

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
