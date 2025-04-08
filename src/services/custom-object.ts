import type { CustomObjectDraft } from "@commercetools/platform-sdk";
import type { Request, Response, Router } from "express";
import type { CustomObjectRepository } from "../repositories/custom-object";
import { getRepositoryContext } from "../repositories/helpers";
import AbstractService from "./abstract";

export class CustomObjectService extends AbstractService {
	public repository: CustomObjectRepository;

	constructor(parent: Router, repository: CustomObjectRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "custom-objects";
	}

	extraRoutes(router: Router) {
		router.get("/:container", this.getWithContainer.bind(this));
		router.get("/:container/:key", this.getWithContainerAndKey.bind(this));
		router.post("/:container/:key", this.createWithContainerAndKey.bind(this));
		router.delete(
			"/:container/:key",
			this.deleteWithContainerAndKey.bind(this),
		);
	}

	getWithContainer(request: Request, response: Response) {
		const limit = this._parseParam(request.query.limit);
		const offset = this._parseParam(request.query.offset);

		const result = this.repository.queryWithContainer(
			getRepositoryContext(request),
			request.params.container,
			{
				expand: this._parseParam(request.query.expand),
				where: this._parseParam(request.query.where),
				limit: limit !== undefined ? Number(limit) : undefined,
				offset: offset !== undefined ? Number(offset) : undefined,
			},
		);

		response.status(200).send(result);
	}

	getWithContainerAndKey(request: Request, response: Response) {
		const result = this.repository.getWithContainerAndKey(
			getRepositoryContext(request),
			request.params.container,
			request.params.key,
		);

		if (!result) {
			response.status(404).send({ statusCode: 404 });
			return;
		}
		response.status(200).send(result);
	}

	createWithContainerAndKey(request: Request, response: Response) {
		const draft: CustomObjectDraft = {
			...request.body,
			key: request.params.key,
			container: request.params.container,
		};

		const result = this.repository.create(getRepositoryContext(request), draft);
		response.status(200).send(result);
	}

	deleteWithContainerAndKey(request: Request, response: Response) {
		const current = this.repository.getWithContainerAndKey(
			getRepositoryContext(request),
			request.params.container,
			request.params.key,
		);

		if (!current) {
			response.status(404).send({ statusCode: 404 });
			return;
		}

		const result = this.repository.delete(
			getRepositoryContext(request),
			current.id,
		);

		response.status(200).send(result);
	}
}
