import type { Router } from "express";
import type { RecurrencePolicyRepository } from "../repositories/recurrence-policy/index.ts";
import AbstractService from "./abstract.ts";

export class RecurrencePolicyService extends AbstractService {
	public repository: RecurrencePolicyRepository;

	constructor(parent: Router, repository: RecurrencePolicyRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "recurrence-policies";
	}
}
