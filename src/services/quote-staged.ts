import type { FastifyInstance } from "fastify";
import type { StagedQuoteRepository } from "#src/repositories/quote-staged/index.ts";
import AbstractService, { singleStoreScope } from "./abstract.ts";

export class StagedQuoteService extends AbstractService {
	public repository: StagedQuoteRepository;

	protected override storeScope = singleStoreScope;

	constructor(parent: FastifyInstance, repository: StagedQuoteRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "staged-quotes";
	}
}
