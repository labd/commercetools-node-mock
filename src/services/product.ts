import type { ProductSearchRequest } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getRepositoryContext } from "#src/repositories/helpers.ts";
import type { ProductRepository } from "../repositories/product/index.ts";
import AbstractService from "./abstract.ts";

export class ProductService extends AbstractService {
	public repository: ProductRepository;

	constructor(parent: FastifyInstance, repository: ProductRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "products";
	}

	extraRoutes(instance: FastifyInstance) {
		instance.post("/search", this.search.bind(this));
	}

	async search(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: ProductSearchRequest;
		}>,
		reply: FastifyReply,
	) {
		const searchBody = request.body;
		const resource = await this.repository.search(
			getRepositoryContext(request),
			searchBody,
		);
		return reply.status(200).send(resource);
	}
}
