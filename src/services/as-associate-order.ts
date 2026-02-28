import type { FastifyInstance } from "fastify";
import type { MyOrderRepository } from "../repositories/my-order.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateOrderService extends AbstractService {
	public repository: MyOrderRepository;

	constructor(parent: FastifyInstance, repository: MyOrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "orders";
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
