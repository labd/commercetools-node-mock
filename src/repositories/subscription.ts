import type {
	InvalidInputError,
	Subscription,
	SubscriptionDraft,
	SubscriptionSetKeyAction,
	SubscriptionUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { CommercetoolsError } from "~src/exceptions";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract";
import { AbstractResourceRepository, AbstractUpdateHandler } from "./abstract";

export class SubscriptionRepository extends AbstractResourceRepository<"subscription"> {
	constructor(config: Config) {
		super("subscription", config);
		this.actions = new SubscriptionUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: SubscriptionDraft): Subscription {
		// TODO: We could actually test this here by using the aws sdk. For now
		// hardcode a failed check when account id is 0000000000
		if (draft.destination.type === "SQS") {
			const queueURL = new URL(draft.destination.queueUrl);
			const accountId = queueURL.pathname.split("/")[1];
			if (accountId === "0000000000") {
				const dest = draft.destination;
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: "InvalidInput",
						message:
							"A test message could not be delivered to this destination: " +
							`SQS ${dest.queueUrl} in ${dest.region} for ${dest.accessKey}. ` +
							"Please make sure your destination is correctly configured.",
					},
					400,
				);
			}
		}

		const resource: Subscription = {
			...getBaseResourceProperties(),
			changes: draft.changes || [],
			destination: draft.destination,
			format: draft.format || {
				type: "Platform",
			},
			key: draft.key,
			messages: draft.messages || [],
			status: "Healthy",
			events: draft.events || [],
		};
		return this.saveNew(context, resource);
	}
}

class SubscriptionUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<Subscription, SubscriptionUpdateAction>>
{
	setKey(
		_context: RepositoryContext,
		resource: Writable<Subscription>,
		{ key }: SubscriptionSetKeyAction,
	) {
		resource.key = key;
	}
}
