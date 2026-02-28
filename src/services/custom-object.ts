import type { CustomObjectDraft } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { CustomObjectRepository } from "../repositories/custom-object.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import AbstractService from "./abstract.ts";

export class CustomObjectService extends AbstractService {
	public repository: CustomObjectRepository;

	constructor(parent: FastifyInstance, repository: CustomObjectRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "custom-objects";
	}

	registerRoutes(parent: FastifyInstance) {
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				// Custom object specific routes
				instance.get(
					"/:container/:key",
					this.getWithContainerAndKey.bind(this),
				);
				instance.post(
					"/:container/:key",
					this.createWithContainerAndKey.bind(this),
				);
				instance.delete(
					"/:container/:key",
					this.deleteWithContainerAndKey.bind(this),
				);

				// Standard routes, but use /:container instead of /:id for GET
				// to avoid duplicate parametric route conflict in Fastify.
				// In Express, /:container was registered first and shadowed /:id.
				instance.get("/", this.get.bind(this));
				instance.get("/key=:key", this.getWithKey.bind(this));
				instance.get("/:container", this.getWithContainer.bind(this));

				instance.delete("/key=:key", this.deleteWithKey.bind(this));
				instance.delete("/:id", this.deleteWithId.bind(this));

				instance.post("/", this.post.bind(this));
				instance.post("/key=:key", this.postWithKey.bind(this));
				instance.post("/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}

	getWithContainer(request: FastifyRequest<{ Params: Record<string, string>; Querystring: Record<string, any> }>, reply: FastifyReply) {
		const params = request.params;
		const query = request.query;
		const limit = this._parseParam(query.limit);
		const offset = this._parseParam(query.offset);

		const result = this.repository.queryWithContainer(
			getRepositoryContext(request),
			params.container,
			{
				expand: this._parseParam(query.expand),
				where: this._parseParam(query.where),
				limit: limit !== undefined ? Number(limit) : undefined,
				offset: offset !== undefined ? Number(offset) : undefined,
			},
		);

		return reply.status(200).send(result);
	}

	getWithContainerAndKey(request: FastifyRequest<{ Params: Record<string, string> }>, reply: FastifyReply) {
		const params = request.params;
		const result = this.repository.getWithContainerAndKey(
			getRepositoryContext(request),
			params.container,
			params.key,
		);

		if (!result) {
			return reply.status(404).send({ statusCode: 404 });
		}
		return reply.status(200).send(result);
	}

	createWithContainerAndKey(request: FastifyRequest<{ Params: Record<string, string>; Body: any }>, reply: FastifyReply) {
		const params = request.params;
		const draft: CustomObjectDraft = {
			...request.body,
			key: params.key,
			container: params.container,
		};

		const result = this.repository.create(getRepositoryContext(request), draft);
		return reply.status(200).send(result);
	}

	deleteWithContainerAndKey(request: FastifyRequest<{ Params: Record<string, string> }>, reply: FastifyReply) {
		const params = request.params;
		const current = this.repository.getWithContainerAndKey(
			getRepositoryContext(request),
			params.container,
			params.key,
		);

		if (!current) {
			return reply.status(404).send({ statusCode: 404 });
		}

		const result = this.repository.delete(
			getRepositoryContext(request),
			current.id,
		);

		return reply.status(200).send(result);
	}
}
