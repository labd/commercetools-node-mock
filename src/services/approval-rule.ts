import type { FastifyInstance } from "fastify";
import type { ApprovalRuleRepository } from "#src/repositories/approval-rule.ts";
import AbstractService from "./abstract.ts";

export class ApprovalRuleService extends AbstractService {
	public repository: ApprovalRuleRepository;

	constructor(parent: FastifyInstance, repository: ApprovalRuleRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "approval-rules";
	}
}
