import type { FastifyInstance } from "fastify";
import type { AsAssociateQuoteRepository } from "#src/repositories/as-associate.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateQuoteService extends AbstractService {
	public repository: AsAssociateQuoteRepository;

	constructor(parent: FastifyInstance, repository: AsAssociateQuoteRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quotes";
	}

	registerRoutes(parent: FastifyInstance) {
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("/", this.get.bind(this));
				instance.get("/key=:key", this.getWithKey.bind(this));
				instance.get("/:id", this.getWithId.bind(this));

				// An associate reads and updates quotes; quotes are created by the
				// seller, so the associate scope has no create or delete route
				instance.post("/key=:key", this.postWithKey.bind(this));
				instance.post("/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}
}
