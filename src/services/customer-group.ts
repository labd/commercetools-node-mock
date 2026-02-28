import type { FastifyInstance } from "fastify";
import type { CustomerGroupRepository } from "../repositories/customer-group.ts";
import AbstractService from "./abstract.ts";

export class CustomerGroupService extends AbstractService {
	public repository: CustomerGroupRepository;

	constructor(parent: FastifyInstance, repository: CustomerGroupRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "customer-groups";
	}
}
