import type { FastifyInstance } from "fastify";
import type { AsAssociateApprovalFlowRepository } from "#src/repositories/as-associate.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateApprovalFlowService extends AbstractService {
	public repository: AsAssociateApprovalFlowRepository;

	constructor(
		parent: FastifyInstance,
		repository: AsAssociateApprovalFlowRepository,
	) {
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

				instance.post("/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}
}
