import type { FastifyInstance } from "fastify";
import type { TypeRepository } from "../repositories/type/index.ts";
import AbstractService from "./abstract.ts";

export class TypeService extends AbstractService {
	public repository: TypeRepository;

	constructor(parent: FastifyInstance, repository: TypeRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "types";
	}
}
