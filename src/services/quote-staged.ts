import type { Router } from "express";
import type { StagedQuoteRepository } from "~src/repositories/quote-staged";
import AbstractService from "./abstract";

export class StagedQuoteService extends AbstractService {
	public repository: StagedQuoteRepository;

	constructor(parent: Router, repository: StagedQuoteRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "staged-quotes";
	}
}
