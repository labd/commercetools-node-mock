import { Router } from "express";
import { CustomerGroupRepository } from "../repositories/customer-group";
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
