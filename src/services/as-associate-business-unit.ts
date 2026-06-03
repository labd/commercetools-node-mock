import type { FastifyInstance } from "fastify";
import type { AsAssociateBusinessUnitRepository } from "#src/repositories/as-associate.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateBusinessUnitService extends AbstractService {
	public repository: AsAssociateBusinessUnitRepository;

	constructor(
		parent: FastifyInstance,
		repository: AsAssociateBusinessUnitRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "business-units";
	}
}
