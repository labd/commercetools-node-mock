import type { Router } from "express";
import type { BusinessUnitRepository } from "../repositories/business-unit";
import AbstractService from "./abstract";

export class BusinessUnitServices extends AbstractService {
	public repository: BusinessUnitRepository;

	constructor(parent: Router, repository: BusinessUnitRepository) {
		super(parent);

		this.repository = repository;
	}

	protected getBasePath(): string {
		return "business-units";
	}
}
