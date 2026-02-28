import type { FastifyInstance } from "fastify";
import type { MyOrderRepository } from "../repositories/my-order.ts";
import AbstractService from "./abstract.ts";

export class MyOrderService extends AbstractService {
	public repository: MyOrderRepository;

	constructor(parent: FastifyInstance, repository: MyOrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me";
	}

	registerRoutes(parent: FastifyInstance) {
		// Overwrite this function to be able to handle /me/active-cart path.
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("/orders", this.get.bind(this));
				instance.get("/orders/:id", this.getWithId.bind(this));

				instance.delete("/orders/:id", this.deleteWithId.bind(this));

				instance.post("/orders", this.post.bind(this));
				instance.post("/orders/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}
}
