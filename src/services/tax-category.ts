import type { Router } from "express";
import type { TaxCategoryRepository } from "../repositories/tax-category";
import AbstractService from "./abstract";

export class TaxCategoryService extends AbstractService {
	public repository: TaxCategoryRepository;

	constructor(parent: Router, repository: TaxCategoryRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "tax-categories";
	}
}
