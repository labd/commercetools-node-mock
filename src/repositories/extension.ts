import type {
	Extension,
	ExtensionChangeDestinationAction,
	ExtensionChangeTriggersAction,
	ExtensionDraft,
	ExtensionSetKeyAction,
	ExtensionSetTimeoutInMsAction,
	ExtensionUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { ExtensionDraftSchema } from "#src/schemas/generated/extension.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import { maskSecretValue } from "../lib/masking.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";

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
