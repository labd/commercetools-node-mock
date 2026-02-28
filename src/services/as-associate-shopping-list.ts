import type { FastifyInstance } from "fastify";
import type { ShoppingListRepository } from "#src/repositories/shopping-list/index.ts";
import AbstractService from "./abstract.ts";

export class AsAssociateShoppingListService extends AbstractService {
	public repository: ShoppingListRepository;

	constructor(parent: FastifyInstance, repository: ShoppingListRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "shopping-lists";
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
