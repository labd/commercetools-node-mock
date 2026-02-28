import type { FastifyInstance } from "fastify";
import type { ProductDiscountRepository } from "../repositories/product-discount.ts";
import AbstractService from "./abstract.ts";

export class ProductDiscountService extends AbstractService {
	public repository: ProductDiscountRepository;

	constructor(parent: FastifyInstance, repository: ProductDiscountRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "product-discounts";
	}
}
