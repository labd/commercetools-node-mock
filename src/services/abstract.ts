import type { Update } from "@commercetools/platform-sdk";
import { type Request, type Response, Router } from "express";
import type { ParsedQs } from "qs";
import { updateRequestSchema } from "~src/schemas/update-request";
import { validateData } from "~src/validate";
import { queryParamsArray } from "../helpers";
import type {
	AbstractResourceRepository,
	QueryParams,
} from "../repositories/abstract";
import { getRepositoryContext } from "../repositories/helpers";

export default abstract class AbstractService {
	public abstract repository: AbstractResourceRepository<any>;

	createStatusCode = 201;

	constructor(parent: Router) {
		this.registerRoutes(parent);
	}

	protected abstract getBasePath(): string;

	extraRoutes(router: Router) {}

	registerRoutes(parent: Router) {
		const basePath = this.getBasePath();
		const router = Router({ mergeParams: true });

		// Bind this first since the `/:id` routes are currently a bit to greedy
		this.extraRoutes(router);

		router.get("/", this.get.bind(this));
		router.get("/key=:key", this.getWithKey.bind(this)); // same thing goes for the key routes
		router.get("/:id", this.getWithId.bind(this));

		router.delete("/key=:key", this.deleteWithKey.bind(this));
		router.delete("/:id", this.deleteWithId.bind(this));

		router.post("/", this.post.bind(this));
		router.post("/key=:key", this.postWithKey.bind(this));
		router.post("/:id", this.postWithId.bind(this));

		parent.use(`/${basePath}`, router);
	}

	get(request: Request, response: Response) {
		const limit = this._parseParam(request.query.limit);
		const offset = this._parseParam(request.query.offset);
		const params: QueryParams = {
			expand: this._parseParam(request.query.expand),
			where: this._parseParam(request.query.where),
			limit: limit !== undefined ? Number(limit) : undefined,
			offset: offset !== undefined ? Number(offset) : undefined,
		};

		for (const key in request.query) {
			if (key.startsWith("var.")) {
				const items = this._parseParam(request.query[key]);
				if (items) {
					params[key] = items.length === 1 ? items[0] : items;
				}
			}
		}

		const result = this.repository.query(getRepositoryContext(request), params);
		response.status(200).send(result);
		return;
	}

	getWithId(request: Request, response: Response) {
		const result = this._expandWithId(request, request.params.id);
		if (!result) {
			response.status(404).send({
				statusCode: 404,
				message: `The Resource with ID '${request.params.id} was not found.`,
				errors: [
					{
						code: "ResourceNotFound",
						message: `The Resource with ID '${request.params.id} was not found.`,
					},
				],
			});
			return;
		}
		response.status(200).send(result);
	}

	getWithKey(request: Request, response: Response) {
		const result = this.repository.getByKey(
			getRepositoryContext(request),
			request.params.key,
			{
				expand: this._parseParam(request.query.expand),
			},
		);
		if (!result) {
			response.status(404).send({
				statusCode: 404,
				message: `The Resource with key '${request.params.id} was not found.`,
				errors: [
					{
						code: "ResourceNotFound",
						message: `The Resource with key '${request.params.id} was not found.`,
					},
				],
			});
			return;
		}
		response.status(200).send(result);
	}

	deleteWithId(request: Request, response: Response) {
		const result = this.repository.delete(
			getRepositoryContext(request),
			request.params.id,
			{
				expand: this._parseParam(request.query.expand),
			},
		);
		if (!result) {
			response.status(404).send({ statusCode: 404 });
			return;
		}
		response.status(200).send(result);
	}

	deleteWithKey(request: Request, response: Response) {
		const resource = this.repository.getByKey(
			getRepositoryContext(request),
			request.params.key,
		);
		if (!resource) {
			response.status(404).send({ statusCode: 404 });
			return;
		}

		const result = this.repository.delete(
			getRepositoryContext(request),
			resource.id,
			{
				expand: this._parseParam(request.query.expand),
			},
		);
		if (!result) {
			response.status(404).send({ statusCode: 404 });
			return;
		}
		response.status(200).send(result);
	}

	post(request: Request, response: Response) {
		const draft = request.body;
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft,
		);
		const result = this._expandWithId(request, resource.id);
		response.status(this.createStatusCode).send(result);
	}

	postWithId(request: Request, response: Response) {
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);
		const resource = this.repository.get(
			getRepositoryContext(request),
			request.params.id,
		);
		if (!resource) {
			response.status(404).send({ statusCode: 404 });
			return;
		}

		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = this._expandWithId(request, updatedResource.id);
		response.status(200).send(result);
	}

	postWithKey(request: Request, response: Response) {
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);

		const resource = this.repository.getByKey(
			getRepositoryContext(request),
			request.params.key,
		);
		if (!resource) {
			response.status(404).send({ statusCode: 404 });
			return;
		}

		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = this._expandWithId(request, updatedResource.id);
		response.status(200).send(result);
	}

	protected _expandWithId(request: Request, resourceId: string) {
		const result = this.repository.get(
			getRepositoryContext(request),
			resourceId,
			{
				expand: this._parseParam(request.query.expand),
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
