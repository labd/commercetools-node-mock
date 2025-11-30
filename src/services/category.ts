import type { Router } from "express";
import type { CategoryRepository } from "../repositories/category/index.ts";
import AbstractService from "./abstract.ts";

export class CategoryServices extends AbstractService {
	public repository: CategoryRepository;

	constructor(parent: Router, repository: CategoryRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "categories";
	}
}
