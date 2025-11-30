import type { Router } from "express";
import type { DiscountGroupRepository } from "../repositories/discount-group/index.ts";
import AbstractService from "./abstract.ts";

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
