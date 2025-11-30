import type { Router } from "express";
import type { StoreRepository } from "../repositories/store.ts";
import AbstractService from "./abstract.ts";

export class StoreService extends AbstractService {
	public repository: StoreRepository;

	constructor(parent: Router, repository: StoreRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "stores";
	}
}
