import type { FastifyInstance } from "fastify";
import type { QuoteRequestRepository } from "#src/repositories/quote-request/index.ts";
import AbstractService from "./abstract.ts";

export class QuoteRequestService extends AbstractService {
	public repository: QuoteRequestRepository;

	constructor(parent: FastifyInstance, repository: QuoteRequestRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quote-requests";
	}
}
