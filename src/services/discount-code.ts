import type { FastifyInstance } from "fastify";
import type { DiscountCodeRepository } from "../repositories/discount-code/index.ts";
import AbstractService from "./abstract.ts";

export class DiscountCodeService extends AbstractService {
	public repository: DiscountCodeRepository;

	constructor(parent: FastifyInstance, repository: DiscountCodeRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "discount-codes";
	}
}
