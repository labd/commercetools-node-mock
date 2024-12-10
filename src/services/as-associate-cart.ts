import { Router } from "express";
import type { CartRepository } from "../repositories/cart";
import AbstractService from "./abstract";

export class AsAssociateCartService extends AbstractService {
	public repository: CartRepository;

	constructor(parent: Router, repository: CartRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "carts";
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
