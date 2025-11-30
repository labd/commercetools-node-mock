import type { Router } from "express";
import type { StateRepository } from "../repositories/state.ts";
import AbstractService from "./abstract.ts";

export class StateService extends AbstractService {
	public repository: StateRepository;

	constructor(parent: Router, repository: StateRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "states";
	}
}
