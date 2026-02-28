import type { FastifyInstance } from "fastify";
import type { StagedQuoteRepository } from "#src/repositories/quote-staged/index.ts";
import AbstractService from "./abstract.ts";

export class StagedQuoteService extends AbstractService {
	public repository: StagedQuoteRepository;

	constructor(parent: FastifyInstance, repository: StagedQuoteRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "staged-quotes";
	}
}
