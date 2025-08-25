import type { Router } from "express";
import type { DiscountGroupRepository } from "../repositories/discount-group/index";
import AbstractService from "./abstract";

export class DiscountGroupService extends AbstractService {
	public repository: DiscountGroupRepository;

	constructor(parent: Router, repository: DiscountGroupRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "discount-groups";
	}
}
