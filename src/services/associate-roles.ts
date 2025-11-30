import type { Router } from "express";
import type { AssociateRoleRepository } from "../repositories/associate-role.ts";
import AbstractService from "./abstract.ts";

export class AssociateRoleServices extends AbstractService {
	public repository: AssociateRoleRepository;

	constructor(parent: Router, repository: AssociateRoleRepository) {
		super(parent);

		this.repository = repository;
	}

	protected getBasePath(): string {
		return "associate-roles";
	}
}
