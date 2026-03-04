import type {
	ResourceNotFoundError,
	Update,
} from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ParsedQs } from "qs";
import { CommercetoolsError } from "#src/exceptions.ts";
import { updateRequestSchema } from "#src/schemas/update-request.ts";
import { validateData, validateDraft } from "#src/validate.ts";
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

	async get(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
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

		const result = await this.repository.query(
			getRepositoryContext(request),
			params,
		);
		return reply.status(200).send(result);
	}

	async getWithId(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const result = await this._expandWithId(request, params.id);
		if (!result) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: `The Resource with ID '${params.id}' was not found.`,
				},
				404,
			);
		}
		return reply.status(200).send(result);
	}

	async getWithKey(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const result = await this.repository.getByKey(
			getRepositoryContext(request),
			params.key,
			{
				expand: this._parseParam(query.expand),
			},
		);
		if (!result) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: `The Resource with key '${params.key}' was not found.`,
				},
				404,
			);
		}
		return reply.status(200).send(result);
	}

	async deleteWithId(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const result = await this.repository.delete(
			getRepositoryContext(request),
			params.id,
			{
				expand: this._parseParam(query.expand),
			},
		);
		if (!result) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: `The Resource with ID '${params.id}' was not found.`,
				},
				404,
			);
		}
		return reply.status(200).send(result);
	}

	async deleteWithKey(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const resource = await this.repository.getByKey(
			getRepositoryContext(request),
			params.key,
		);
		if (!resource) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: `The Resource with key '${params.key}' was not found.`,
				},
				404,
			);
		}

		const result = await this.repository.delete(
			getRepositoryContext(request),
			resource.id,
			{
				expand: this._parseParam(query.expand),
			},
		);
		if (!result) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: `The Resource with ID '${resource.id}' was not found.`,
				},
				404,
			);
		}
		return reply.status(200).send(result);
	}

	async post(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		// Validate the draft against the schema when strict mode is enabled
		if (this.repository.strict && this.repository.draftSchema) {
			validateDraft(request.body, this.repository.draftSchema);
		}

		const resource = await this.repository.create(
			getRepositoryContext(request),
			request.body,
		);

		const query = request.query;
		const expand = this._parseParam(query.expand);

		// Apply expand on the already-created resource and post-process it
		// instead of re-fetching from storage via _expandWithId.
		const context = getRepositoryContext(request);
		const expanded = await this.repository.expand(context, resource, expand);
		const result = await this.repository.postProcessResource(
			context,
			expanded,
			{ expand },
		);
		return reply.status(this.createStatusCode).send(result);
	}

	async postWithId(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);
		const resource = await this.repository.get(
			getRepositoryContext(request),
			params.id,
		);
		if (!resource) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: `The Resource with ID '${params.id}' was not found.`,
				},
				404,
			);
		}

		const updatedResource = await this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = await this._expandWithId(request, updatedResource.id);
		return reply.status(200).send(result);
	}

	async postWithKey(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);

		const resource = await this.repository.getByKey(
			getRepositoryContext(request),
			params.key,
		);
		if (!resource) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: `The Resource with key '${params.key}' was not found.`,
				},
				404,
			);
		}

		const updatedResource = await this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = await this._expandWithId(request, updatedResource.id);
		return reply.status(200).send(result);
	}

	protected async _expandWithId(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		resourceId: string,
	) {
		const query = request.query;
		const result = await this.repository.get(
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
