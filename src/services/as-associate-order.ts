import { Router } from "express";
import type { MyOrderRepository } from "../repositories/my-order.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateOrderService extends AbstractService {
	public repository: MyOrderRepository;

	constructor(parent: Router, repository: MyOrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "orders";
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
