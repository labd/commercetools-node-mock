import type { Router } from "express";
import type { InventoryEntryRepository } from "../repositories/inventory-entry/index.ts";
import AbstractService from "./abstract.ts";

export class InventoryEntryService extends AbstractService {
	public repository: InventoryEntryRepository;

	constructor(parent: Router, repository: InventoryEntryRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "inventory";
	}
}
