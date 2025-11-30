import type { Router } from "express";
import type { StandAlonePriceRepository } from "../repositories/standalone-price.ts";
import AbstractService from "./abstract.ts";

export class StandAlonePriceService extends AbstractService {
	public repository: StandAlonePriceRepository;

	constructor(parent: Router, repository: StandAlonePriceRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "standalone-prices";
	}
}
