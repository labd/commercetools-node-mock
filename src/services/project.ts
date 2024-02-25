import { Update } from "@commercetools/platform-sdk";
import { Request, Response, Router } from "express";
import { updateRequestSchema } from "~src/schemas/update-request";
import { validateData } from "~src/validate";
import { getRepositoryContext } from "../repositories/helpers";
import { ProjectRepository } from "../repositories/project";

export class ProjectService {
	public repository: ProjectRepository;

	constructor(parent: Router, repository: ProjectRepository) {
		this.repository = repository;
		this.registerRoutes(parent);
	}

	registerRoutes(parent: Router) {
		parent.get("", this.get.bind(this));
		parent.post("", this.post.bind(this));
	}

	get(request: Request, response: Response) {
		const project = this.repository.get(getRepositoryContext(request));
		return response.status(200).send(project);
	}

	post(request: Request, response: Response) {
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);
		const project = this.repository.get(getRepositoryContext(request));

		if (!project) {
			return response.status(404).send({});
		}

		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			project,
			updateRequest.version,
			updateRequest.actions,
		);

		return response.status(200).send(updatedResource);
	}
}
