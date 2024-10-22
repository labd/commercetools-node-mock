import { Router } from "express";
import type { BusinessUnitRepository } from "~src/repositories/business-unit";
import AbstractService from "./abstract";

export class MyBusinessUnitService extends AbstractService {
	public repository: BusinessUnitRepository;

	constructor(parent: Router, repository: BusinessUnitRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me";
	}

	registerRoutes(parent: Router) {
		// Overwrite this function to be able to handle /me/business-units path.
		const basePath = this.getBasePath();
		const router = Router({ mergeParams: true });

		this.extraRoutes(router);

		router.get("/business-units/", this.get.bind(this));

		parent.use(`/${basePath}`, router);
	}
}
