import type { FastifyInstance } from "fastify";
import type { StateRepository } from "../repositories/state.ts";
import AbstractService from "./abstract.ts";

export class StateService extends AbstractService {
	public repository: StateRepository;

	constructor(parent: FastifyInstance, repository: StateRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "states";
	}
}
