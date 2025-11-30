import { Router } from "express";
import type { BusinessUnitRepository } from "#src/repositories/business-unit.ts";
import AbstractService from "./abstract.ts";

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
		router.get("/business-units/key=:key", this.getWithKey.bind(this));
		router.get("/business-units/:id", this.getWithId.bind(this));

		router.delete("/business-units/key=:key", this.deleteWithKey.bind(this));
		router.delete("/business-units/:id", this.deleteWithId.bind(this));

		router.post("/business-units/", this.post.bind(this));
		router.post("/business-units/key=:key", this.postWithKey.bind(this));
		router.post("/business-units/:id", this.postWithId.bind(this));

		parent.use(`/${basePath}`, router);
	}
}
