import type { Router } from "express";
import type { CustomerGroupRepository } from "../repositories/customer-group";
import AbstractService from "./abstract";

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
