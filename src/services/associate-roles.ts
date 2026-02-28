import type { FastifyInstance } from "fastify";
import type { AssociateRoleRepository } from "../repositories/associate-role.ts";
import AbstractService from "./abstract.ts";

export class AssociateRoleServices extends AbstractService {
	public repository: AssociateRoleRepository;

	constructor(parent: FastifyInstance, repository: AssociateRoleRepository) {
		super(parent);

		this.repository = repository;
	}

	protected getBasePath(): string {
		return "associate-roles";
	}
}
