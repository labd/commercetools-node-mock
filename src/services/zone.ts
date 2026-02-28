import type { FastifyInstance } from "fastify";
import type { ZoneRepository } from "../repositories/zone.ts";
import AbstractService from "./abstract.ts";

export class ZoneService extends AbstractService {
	public repository: ZoneRepository;

	constructor(parent: FastifyInstance, repository: ZoneRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "zones";
	}
}
