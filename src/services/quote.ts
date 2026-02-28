import type { FastifyInstance } from "fastify";
import type { QuoteRepository } from "#src/repositories/quote/index.ts";
import AbstractService from "./abstract.ts";

export class QuoteService extends AbstractService {
	public repository: QuoteRepository;

	constructor(parent: FastifyInstance, repository: QuoteRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quotes";
	}
}
