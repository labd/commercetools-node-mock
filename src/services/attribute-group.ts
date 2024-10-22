import type { Router } from "express";
import type { AttributeGroupRepository } from "../repositories/attribute-group";
import AbstractService from "./abstract";

export class AttributeGroupService extends AbstractService {
	public repository: AttributeGroupRepository;

	constructor(parent: Router, repository: AttributeGroupRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "attribute-groups";
	}
}
