import type {
	ResourceNotFoundError,
	Update,
} from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
import { updateRequestSchema } from "#src/schemas/update-request.ts";
import { validateData } from "#src/validate.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { ProjectRepository } from "../repositories/project.ts";

export class ProjectService {
	public repository: ProjectRepository;

	constructor(parent: FastifyInstance, repository: ProjectRepository) {
		this.repository = repository;
		this.registerRoutes(parent);
	}

	registerRoutes(parent: FastifyInstance) {
		parent.get("", this.get.bind(this));
		parent.post("", this.post.bind(this));
	}

	async get(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const project = await this.repository.get(getRepositoryContext(request));
		return reply.status(200).send(project);
	}

	async post(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);
		const project = await this.repository.get(getRepositoryContext(request));

		if (!project) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "The Resource was not found.",
				},
				404,
			);
		}

		const updatedResource = await this.repository.processUpdateActions(
			getRepositoryContext(request),
			project,
			updateRequest.version,
			updateRequest.actions,
		);

		return reply.status(200).send(updatedResource);
	}
}
