import type { Router } from "express";
import type { QuoteRequestRepository } from "~src/repositories/quote-request";
import AbstractService from "./abstract";

export class QuoteRequestService extends AbstractService {
	public repository: QuoteRequestRepository;

	constructor(parent: Router, repository: QuoteRequestRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quote-requests";
	}
}
