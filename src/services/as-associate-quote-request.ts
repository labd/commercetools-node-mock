import type { FastifyInstance } from "fastify";
import type { MyQuoteRequestRepository } from "#src/repositories/my-quote-request.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateQuoteRequestService extends AbstractService {
	public repository: MyQuoteRequestRepository;

	constructor(parent: FastifyInstance, repository: MyQuoteRequestRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quote-requests";
	}

	registerRoutes(parent: FastifyInstance) {
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("/", this.get.bind(this));
				instance.get("/:id", this.getWithId.bind(this));

				instance.delete("/:id", this.deleteWithId.bind(this));

				instance.post("/", this.post.bind(this));
				instance.post("/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}
}
