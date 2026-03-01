import type {
	Subscription,
	SubscriptionDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const subscriptionDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<SubscriptionDraft, SubscriptionDraft, Subscription>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/subscriptions",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `subscription-${sequence}`,
				destination: {
					type: "SQS",
					queueUrl: `https://sqs.us-east-1.amazonaws.com/123456789/queue-${sequence}`,
					accessKey: "AKIAIOSFODNN7EXAMPLE",
					accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
					region: "us-east-1",
				},
				messages: [
					{
						resourceTypeId: "order",
						types: ["OrderCreated"],
					},
				],
			};
		},
	);
