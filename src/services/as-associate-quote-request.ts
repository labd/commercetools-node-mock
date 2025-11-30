import { Router } from "express";
import type { MyQuoteRequestRepository } from "#src/repositories/my-quote-request.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateQuoteRequestService extends AbstractService {
	public repository: MyQuoteRequestRepository;

	constructor(parent: Router, repository: MyQuoteRequestRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quote-requests";
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
