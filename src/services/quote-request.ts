import type { FastifyInstance } from "fastify";
import type { QuoteRequestRepository } from "#src/repositories/quote-request/index.ts";
import AbstractService, { singleStoreScope } from "./abstract.ts";

export class QuoteRequestService extends AbstractService {
	public repository: QuoteRequestRepository;

	protected override storeScope = singleStoreScope;

	constructor(parent: FastifyInstance, repository: QuoteRequestRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quote-requests";
	}
}
