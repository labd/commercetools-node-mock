import type { FastifyInstance } from "fastify";
import type { ProductTypeRepository } from "../repositories/product-type.ts";
import AbstractService from "./abstract.ts";

export class ProductTypeService extends AbstractService {
	public repository: ProductTypeRepository;

	constructor(parent: FastifyInstance, repository: ProductTypeRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "product-types";
	}
}
