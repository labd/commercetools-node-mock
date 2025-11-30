import type { Router } from "express";
import type { CustomerGroupRepository } from "../repositories/customer-group.ts";
import AbstractService from "./abstract.ts";

export class CustomerGroupService extends AbstractService {
	public repository: CustomerGroupRepository;

	constructor(parent: Router, repository: CustomerGroupRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "customer-groups";
	}
}
