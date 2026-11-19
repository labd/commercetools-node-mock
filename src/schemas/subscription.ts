import { z } from "zod";
import { DeliveryFormatSchema } from "./generated/common.ts";
import { SubscriptionDraftSchema } from "./generated/subscription.ts";

/**
 * The generated `DestinationSchema` only carries the discriminator, because the
 * OpenAPI spec models Destination as a union. Validating the variants is the
 * point of this endpoint for consumers that generate subscriptions (for example
 * the Terraform provider), so the variants are spelled out here.
 *
 * @see https://docs.commercetools.com/api/projects/subscriptions#destination
 */
const SubscriptionDestinationSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("SQS"),
		queueUrl: z.string(),
		region: z.string(),
		accessKey: z.string().nullish(),
		accessSecret: z.string().nullish(),
		authenticationMode: z.enum(["Credentials", "IAM"]).nullish(),
	}),
	z.object({
		type: z.literal("SNS"),
		topicArn: z.string(),
		accessKey: z.string().nullish(),
		accessSecret: z.string().nullish(),
		authenticationMode: z.enum(["Credentials", "IAM"]).nullish(),
	}),
	z.object({
		type: z.literal("EventBridge"),
		region: z.string(),
		accountId: z.string(),
	}),
	z.object({
		type: z.literal("GoogleCloudPubSub"),
		projectId: z.string(),
		topic: z.string(),
	}),
	z.object({
		type: z.literal("EventGrid"),
		uri: z.string(),
		accessKey: z.string(),
	}),
	z.object({
		type: z.literal("AzureServiceBus"),
		connectionString: z.string(),
	}),
	z.object({
		type: z.literal("ConfluentCloud"),
		bootstrapServer: z.string(),
		apiKey: z.string(),
		apiSecret: z.string(),
		acks: z.string(),
		topic: z.string(),
		key: z.string().nullish(),
	}),
]);

export const SubscriptionDraftWithDestinationSchema =
	SubscriptionDraftSchema.extend({
		destination: SubscriptionDestinationSchema,
		format: DeliveryFormatSchema.nullish(),
	});
