import type { FastifyInstance } from "fastify";
import type { ApprovalFlowRepository } from "#src/repositories/approval-flow.ts";
import AbstractService from "./abstract.ts";

export class ApprovalFlowService extends AbstractService {
	public repository: ApprovalFlowRepository;

	constructor(parent: FastifyInstance, repository: ApprovalFlowRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "approval-flows";
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
