import type { ResourceNotFoundError } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { CartRepository } from "../repositories/cart/index.ts";
import AbstractService from "./abstract.ts";

export class MyCartService extends AbstractService {
	public repository: CartRepository;

	constructor(parent: FastifyInstance, repository: CartRepository) {
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

				instance.get("/active-cart", this.activeCart.bind(this));
				instance.get("/carts", this.get.bind(this));
				instance.get("/carts/:id", this.getWithId.bind(this));

				instance.delete("/carts/:id", this.deleteWithId.bind(this));

				instance.post("/carts", this.post.bind(this));
				instance.post("/carts/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}

	async activeCart(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const resource = await this.repository.getActiveCart(params.projectKey);
		if (!resource) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "No active cart exists.",
				},
				404,
			);
		}
		return reply.status(200).send(resource);
	}
}
