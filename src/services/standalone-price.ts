import { Router } from "express";
import { StandAlonePriceRepository } from "../repositories/standalone-price";
import AbstractService from "./abstract";

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
