import { Router } from "express";
import { ProductRepository } from "../repositories/product";
import AbstractService from "./abstract";

export class ProductService extends AbstractService {
	public repository: ProductRepository;

	constructor(parent: Router, repository: ProductRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "products";
	}
}
