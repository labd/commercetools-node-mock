import type { Router } from "express";
import type { QuoteRepository } from "~src/repositories/quote";
import AbstractService from "./abstract";

export class QuoteService extends AbstractService {
	public repository: QuoteRepository;

	constructor(parent: Router, repository: QuoteRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quotes";
	}
}
