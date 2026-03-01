import type { Update } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ParsedQs } from "qs";
import { updateRequestSchema } from "#src/schemas/update-request.ts";
import { validateData } from "#src/validate.ts";
import { queryParamsArray } from "../helpers.ts";
import type {
	AbstractResourceRepository,
	QueryParams,
} from "../repositories/abstract.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";

export default abstract class AbstractService {
	public abstract repository: AbstractResourceRepository<any>;

	createStatusCode = 201;

	constructor(parent: FastifyInstance) {
		this.registerRoutes(parent);
	}

	protected abstract getBasePath(): string;

	extraRoutes(instance: FastifyInstance) {}

	registerRoutes(parent: FastifyInstance) {
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("/", this.get.bind(this));
				instance.get("/key=:key", this.getWithKey.bind(this));
				instance.get("/:id", this.getWithId.bind(this));

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

	get(
		request: FastifyRequest<{ Querystring: Record<string, any> }>,
		reply: FastifyReply,
	) {
		const query = request.query;
		const limit = this._parseParam(query.limit);
		const offset = this._parseParam(query.offset);
		const params: QueryParams = {
			expand: this._parseParam(query.expand),
			where: this._parseParam(query.where),
			limit: limit !== undefined ? Number(limit) : undefined,
			offset: offset !== undefined ? Number(offset) : undefined,
		};

		for (const key in query) {
			if (key.startsWith("var.")) {
				const items = this._parseParam(query[key]);
				if (items) {
					params[key] = items.length === 1 ? items[0] : items;
				}
			}
		}

		const result = this.repository.query(getRepositoryContext(request), params);
		return reply.status(200).send(result);
	}

	getWithId(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const result = this._expandWithId(request, params.id);
		if (!result) {
			return reply.status(404).send({
				statusCode: 404,
				message: `The Resource with ID '${params.id} was not found.`,
				errors: [
					{
						code: "ResourceNotFound",
						message: `The Resource with ID '${params.id} was not found.`,
					},
				],
			});
		}
		return reply.status(200).send(result);
	}

	getWithKey(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const result = this.repository.getByKey(
			getRepositoryContext(request),
			params.key,
			{
				expand: this._parseParam(query.expand),
			},
		);
		if (!result) {
			return reply.status(404).send({
				statusCode: 404,
				message: `The Resource with key '${params.id} was not found.`,
				errors: [
					{
						code: "ResourceNotFound",
						message: `The Resource with key '${params.id} was not found.`,
					},
				],
			});
		}
		return reply.status(200).send(result);
	}

	deleteWithId(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const result = this.repository.delete(
			getRepositoryContext(request),
			params.id,
			{
				expand: this._parseParam(query.expand),
			},
		);
		if (!result) {
			return reply.status(404).send({ statusCode: 404 });
		}
		return reply.status(200).send(result);
	}

	deleteWithKey(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const resource = this.repository.getByKey(
			getRepositoryContext(request),
			params.key,
		);
		if (!resource) {
			return reply.status(404).send({ statusCode: 404 });
		}

		const result = this.repository.delete(
			getRepositoryContext(request),
			resource.id,
			{
				expand: this._parseParam(query.expand),
			},
		);
		if (!result) {
			return reply.status(404).send({ statusCode: 404 });
		}
		return reply.status(200).send(result);
	}

	post(request: FastifyRequest, reply: FastifyReply) {
		const draft = request.body;
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft,
		);
		const result = this._expandWithId(request, resource.id);
		return reply.status(this.createStatusCode).send(result);
	}

	postWithId(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);
		const resource = this.repository.get(
			getRepositoryContext(request),
			params.id,
		);
		if (!resource) {
			return reply.status(404).send({ statusCode: 404 });
		}

		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = this._expandWithId(request, updatedResource.id);
		return reply.status(200).send(result);
	}

	postWithKey(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);

		const resource = this.repository.getByKey(
			getRepositoryContext(request),
			params.key,
		);
		if (!resource) {
			return reply.status(404).send({ statusCode: 404 });
		}

		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = this._expandWithId(request, updatedResource.id);
		return reply.status(200).send(result);
	}

	protected _expandWithId(
		request: FastifyRequest<{ Querystring: Record<string, any> }>,
		resourceId: string,
	) {
		const query = request.query;
		const result = this.repository.get(
			getRepositoryContext(request),
			resourceId,
			{
				expand: this._parseParam(query.expand),
			},
		);
		return result;
	}

	// No idea what i'm doing
	protected _parseParam(
		value: string | ParsedQs | string[] | ParsedQs[] | undefined,
	): string[] | undefined {
		return queryParamsArray(value);
	}
}
