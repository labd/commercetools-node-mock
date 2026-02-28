import type { FastifyInstance } from "fastify";
import type { StandAlonePriceRepository } from "../repositories/standalone-price.ts";
import AbstractService from "./abstract.ts";

export class StandAlonePriceService extends AbstractService {
	public repository: StandAlonePriceRepository;

	constructor(parent: FastifyInstance, repository: StandAlonePriceRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "standalone-prices";
	}
}
