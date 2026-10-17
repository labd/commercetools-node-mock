import type {
	CommerceMcpServerConfig,
	McpServer,
	McpServerDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { McpServerDraftSchema } from "#src/schemas/generated/mcp-server.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { McpServerUpdateHandler } from "./actions.ts";

export class McpServerRepository extends AbstractResourceRepository<"mcp-server"> {
	constructor(config: Config) {
		super("mcp-server", config);
		this.actions = new McpServerUpdateHandler(config.storage);
		this.draftSchema = McpServerDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: McpServerDraft,
	): Promise<McpServer> {
		const base = getBaseResourceProperties(context.clientId);
		const config: CommerceMcpServerConfig = {
			type: "CommerceMCP",
			majorVersion: draft.mcpServer.majorVersion,
			// commercetools assigns the URL the MCP Server is reached on.
			url: `https://mcp.europe-west1.gcp.commercetools.com/${context.projectKey}/${base.id}`,
			tools: draft.mcpServer.tools,
			toolCustomizations: draft.mcpServer.toolCustomizations ?? [],
			jsonOutputFiltering: draft.mcpServer.jsonOutputFiltering,
			toolOutputFormatting: draft.mcpServer.toolOutputFormatting,
		};
		const resource: McpServer = {
			...base,
			key: draft.key,
			name: draft.name,
			description: draft.description,
			authenticationMode: draft.authenticationMode ?? "ClientCredentials",
			state: draft.state ?? "Disabled",
			mcpServer: config,
		};
		return await this.saveNew(context, resource);
	}
}
