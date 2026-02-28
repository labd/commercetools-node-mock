import type { FastifyInstance } from "fastify";
import type { BusinessUnitRepository } from "../repositories/business-unit.ts";
import AbstractService from "./abstract.ts";

export class BusinessUnitServices extends AbstractService {
	public repository: BusinessUnitRepository;

	constructor(parent: FastifyInstance, repository: BusinessUnitRepository) {
		super(parent);

		this.repository = repository;
	}

	protected getBasePath(): string {
		return "business-units";
	}
}
