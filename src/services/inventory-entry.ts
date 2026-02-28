import type { FastifyInstance } from "fastify";
import type { InventoryEntryRepository } from "../repositories/inventory-entry/index.ts";
import AbstractService from "./abstract.ts";

export class InventoryEntryService extends AbstractService {
	public repository: InventoryEntryRepository;

	constructor(parent: FastifyInstance, repository: InventoryEntryRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "inventory";
	}
}
