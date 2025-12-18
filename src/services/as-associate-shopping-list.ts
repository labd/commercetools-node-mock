import { Router } from "express";
import type { ShoppingListRepository } from "#src/repositories/shopping-list/index.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateShoppingListService extends AbstractService {
	public repository: ShoppingListRepository;

	constructor(parent: Router, repository: ShoppingListRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "shopping-lists";
	}

	registerRoutes(parent: Router) {
		const basePath = this.getBasePath();
		const router = Router({ mergeParams: true });

		this.extraRoutes(router);

		router.get("/", this.get.bind(this));
		router.get("/:id", this.getWithId.bind(this));

		router.delete("/:id", this.deleteWithId.bind(this));

		router.post("/", this.post.bind(this));
		router.post("/:id", this.postWithId.bind(this));

		parent.use(`/${basePath}`, router);
	}
}
