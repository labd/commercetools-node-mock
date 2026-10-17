import type {
	McpServer,
	McpServerAddToolAction,
	McpServerAddToolCustomizationAction,
	McpServerRemoveToolAction,
	McpServerRemoveToolCustomizationAction,
	McpServerSetAuthenticationModeAction,
	McpServerSetDescriptionAction,
	McpServerSetJsonOutputFilteringAction,
	McpServerSetNameAction,
	McpServerSetStateAction,
	McpServerSetToolCustomizationsAction,
	McpServerSetToolOutputFormattingAction,
	McpServerSetToolsAction,
	McpServerUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler } from "../abstract.ts";

export class McpServerUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<McpServer, McpServerUpdateAction>>
{
	addTool(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ tool }: McpServerAddToolAction,
	) {
		if (!resource.mcpServer.tools.includes(tool)) {
			resource.mcpServer.tools = [...resource.mcpServer.tools, tool];
		}
	}

	removeTool(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ tool }: McpServerRemoveToolAction,
	) {
		resource.mcpServer.tools = resource.mcpServer.tools.filter(
			(t) => t !== tool,
		);
	}

	setTools(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ tools }: McpServerSetToolsAction,
	) {
		resource.mcpServer.tools = tools;
	}

	addToolCustomization(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ toolCustomization }: McpServerAddToolCustomizationAction,
	) {
		// One customization per tool: adding one for a tool replaces its old one.
		resource.mcpServer.toolCustomizations = [
			...resource.mcpServer.toolCustomizations.filter(
				(c) => c.tool !== toolCustomization.tool,
			),
			toolCustomization,
		];
	}

	removeToolCustomization(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ toolCustomization }: McpServerRemoveToolCustomizationAction,
	) {
		resource.mcpServer.toolCustomizations =
			resource.mcpServer.toolCustomizations.filter(
				(c) => c.tool !== toolCustomization.tool,
			);
	}

	setToolCustomizations(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ toolCustomizations }: McpServerSetToolCustomizationsAction,
	) {
		resource.mcpServer.toolCustomizations = toolCustomizations;
	}

	setAuthenticationMode(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ authenticationMode }: McpServerSetAuthenticationModeAction,
	) {
		resource.authenticationMode = authenticationMode;
	}

	setDescription(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ description }: McpServerSetDescriptionAction,
	) {
		resource.description = description;
	}

	setName(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ name }: McpServerSetNameAction,
	) {
		resource.name = name;
	}

	setState(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ state }: McpServerSetStateAction,
	) {
		resource.state = state;
	}

	setJsonOutputFiltering(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ jsonOutputFiltering }: McpServerSetJsonOutputFilteringAction,
	) {
		resource.mcpServer.jsonOutputFiltering = jsonOutputFiltering;
	}

	setToolOutputFormatting(
		_context: RepositoryContext,
		resource: Writable<McpServer>,
		{ toolOutputFormatting }: McpServerSetToolOutputFormattingAction,
	) {
		resource.mcpServer.toolOutputFormatting = toolOutputFormatting;
	}
}
