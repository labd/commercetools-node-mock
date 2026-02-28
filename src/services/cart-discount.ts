import type { FastifyInstance } from "fastify";
import type { CartDiscountRepository } from "../repositories/cart-discount/index.ts";
import AbstractService from "./abstract.ts";

export class CartDiscountService extends AbstractService {
	public repository: CartDiscountRepository;

	constructor(parent: FastifyInstance, repository: CartDiscountRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "cart-discounts";
	}
}
