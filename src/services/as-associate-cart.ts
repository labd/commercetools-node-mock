import type { FastifyInstance } from "fastify";
import type { CartRepository } from "../repositories/cart/index.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateCartService extends AbstractService {
	public repository: CartRepository;

	constructor(parent: FastifyInstance, repository: CartRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "carts";
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
