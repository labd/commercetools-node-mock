import type { Router } from "express";
import type { ProductSelectionRepository } from "../repositories/product-selection.ts";
import AbstractService from "./abstract.ts";

export class ProductSelectionService extends AbstractService {
	public repository: ProductSelectionRepository;

	constructor(parent: Router, repository: ProductSelectionRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "product-selections";
	}
}
