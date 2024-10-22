import type { Router } from "express";
import type { ZoneRepository } from "../repositories/zone";
import AbstractService from "./abstract";

export class ZoneService extends AbstractService {
	public repository: ZoneRepository;

	constructor(parent: Router, repository: ZoneRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "zones";
	}
}
