import type { Router } from "express";
import type { StateRepository } from "../repositories/state";
import AbstractService from "./abstract";

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
