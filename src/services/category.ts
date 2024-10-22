import type { Router } from "express";
import type { CategoryRepository } from "../repositories/category/index";
import AbstractService from "./abstract";

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
