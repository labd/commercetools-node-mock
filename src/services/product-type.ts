import type { Router } from "express";
import type { ProductTypeRepository } from "../repositories/product-type.ts";
import AbstractService from "./abstract.ts";

export class ProductTypeService extends AbstractService {
	public repository: ProductTypeRepository;

	constructor(parent: Router, repository: ProductTypeRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "product-types";
	}
}
