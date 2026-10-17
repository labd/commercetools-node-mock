import type { FastifyInstance } from "fastify";
import type { McpServerRepository } from "../repositories/mcp-server/index.ts";
import AbstractService from "./abstract.ts";

export class McpServerService extends AbstractService {
	public repository: McpServerRepository;

	constructor(parent: FastifyInstance, repository: McpServerRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "mcp-servers";
	}
}
