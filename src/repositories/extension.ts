import type {
	Extension,
	ExtensionChangeDestinationAction,
	ExtensionChangeTriggersAction,
	ExtensionDraft,
	ExtensionSetKeyAction,
	ExtensionSetTimeoutInMsAction,
	ExtensionUpdateAction,
} from "@commercetools/platform-sdk";
import type { AbstractStorage } from "~src/storage";
import { getBaseResourceProperties } from "../helpers";
import { maskSecretValue } from "../lib/masking";
import type { Writable } from "../types";
import type { UpdateHandlerInterface } from "./abstract";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract";

export class ExtensionRepository extends AbstractResourceRepository<"extension"> {
	constructor(storage: AbstractStorage) {
		super("extension", storage);
		this.actions = new ExtensionUpdateHandler(storage);
	}

	create(context: RepositoryContext, draft: ExtensionDraft): Extension {
		const resource: Extension = {
			...getBaseResourceProperties(),
			key: draft.key,
			timeoutInMs: draft.timeoutInMs,
			destination: draft.destination,
			triggers: draft.triggers,
		};
		return this.saveNew(context, resource);
	}

	postProcessResource(
		context: RepositoryContext,
		resource: Extension,
	): Extension {
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
			} else if (extension.destination.type === "AWSLambda") {
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
