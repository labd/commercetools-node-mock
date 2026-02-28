import type { FastifyInstance } from "fastify";
import type { AttributeGroupRepository } from "../repositories/attribute-group.ts";
import AbstractService from "./abstract.ts";

export class AttributeGroupService extends AbstractService {
	public repository: AttributeGroupRepository;

	constructor(parent: FastifyInstance, repository: AttributeGroupRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "attribute-groups";
	}
}
