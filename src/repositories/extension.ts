import type {
	Extension,
	ExtensionChangeDestinationAction,
	ExtensionChangeTriggersAction,
	ExtensionDraft,
	ExtensionReference,
	ExtensionResourceIdentifier,
	ExtensionSetAdditionalContextAction,
	ExtensionSetDependenciesAction,
	ExtensionSetExpansionPathsAction,
	ExtensionSetKeyAction,
	ExtensionSetTimeoutInMsAction,
	ExtensionUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { ExtensionDraftSchema } from "#src/schemas/generated/extension.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import { maskSecretValue } from "../lib/masking.ts";
import type { AbstractStorage } from "../storage/abstract.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";
import { getReferenceFromResourceIdentifier } from "./helpers.ts";

export class ExtensionRepository extends AbstractResourceRepository<"extension"> {
	constructor(config: Config) {
		super("extension", config);
		this.actions = new ExtensionUpdateHandler(config.storage);
		this.draftSchema = ExtensionDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: ExtensionDraft,
	): Promise<Extension> {
		const resource: Extension = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			timeoutInMs: draft.timeoutInMs,
			destination: draft.destination,
			triggers: draft.triggers,
			dependencies: draft.dependencies
				? await resolveExtensionDependencies(
						context,
						this._storage,
						draft.dependencies,
					)
				: undefined,
			expansionPaths: draft.expansionPaths ?? undefined,
			additionalContext: draft.additionalContext
				? {
						includeOldResource:
							draft.additionalContext.includeOldResource ?? false,
					}
				: undefined,
		};
		return await this.saveNew(context, resource);
	}

	async postProcessResource(
		context: RepositoryContext,
		resource: Extension,
	): Promise<Extension> {
		if (resource) {
			const extension = resource as Extension;
			if (
				extension.destination.type === "HTTP" &&
				extension.destination.authentication?.type === "AuthorizationHeader"
			) {
				return maskSecretValue(
					extension,
					"destination.authentication.headerValue",
				);
			}
			if (extension.destination.type === "AWSLambda") {
				return maskSecretValue(resource, "destination.accessSecret");
			}
		}
		return resource;
	}
}

class ExtensionUpdateHandler
	extends AbstractUpdateHandler
	implements UpdateHandlerInterface<Extension, ExtensionUpdateAction>
{
	changeDestination(
		context: RepositoryContext,
		resource: Writable<Extension>,
		action: ExtensionChangeDestinationAction,
	): void {
		resource.destination = action.destination;
	}

	changeTriggers(
		context: RepositoryContext,
		resource: Writable<Extension>,
		action: ExtensionChangeTriggersAction,
	): void {
		resource.triggers = action.triggers;
	}

	setAdditionalContext(
		context: RepositoryContext,
		resource: Writable<Extension>,
		action: ExtensionSetAdditionalContextAction,
	): void {
		resource.additionalContext = {
			includeOldResource: action.additionalContext.includeOldResource ?? false,
		};
	}

	async setDependencies(
		context: RepositoryContext,
		resource: Writable<Extension>,
		action: ExtensionSetDependenciesAction,
	): Promise<void> {
		resource.dependencies = await resolveExtensionDependencies(
			context,
			this._storage,
			action.dependencies,
		);
	}

	setExpansionPaths(
		context: RepositoryContext,
		resource: Writable<Extension>,
		action: ExtensionSetExpansionPathsAction,
	): void {
		resource.expansionPaths = action.expansionPaths;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<Extension>,
		action: ExtensionSetKeyAction,
	): void {
		resource.key = action.key;
	}

	setTimeoutInMs(
		context: RepositoryContext,
		resource: Writable<Extension>,
		action: ExtensionSetTimeoutInMsAction,
	): void {
		resource.timeoutInMs = action.timeoutInMs;
	}
}

// Dependencies are given as resource identifiers (by `id` or `key`) but stored
// as references, so the referenced extensions are resolved here.
const resolveExtensionDependencies = async (
	context: RepositoryContext,
	storage: AbstractStorage,
	dependencies: ExtensionResourceIdentifier[],
): Promise<ExtensionReference[]> =>
	Promise.all(
		dependencies.map((identifier) =>
			getReferenceFromResourceIdentifier<ExtensionReference>(
				identifier,
				context.projectKey,
				storage,
			),
		),
	);
