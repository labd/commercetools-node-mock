import type {
	Payment,
	PaymentDraft,
	StateReference,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { PaymentDraftSchema } from "#src/schemas/generated/payment.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import {
	createCentPrecisionMoney,
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers.ts";
import { PaymentUpdateHandler } from "./actions.ts";
import { transactionFromTransactionDraft } from "./helpers.ts";

export class PaymentRepository extends AbstractResourceRepository<"payment"> {
	constructor(config: Config) {
		super("payment", config);
		this.actions = new PaymentUpdateHandler(this._storage);
		this.draftSchema = PaymentDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: PaymentDraft,
	): Promise<Payment> {
		const transactions = await Promise.all(
			(draft.transactions || []).map((t) =>
				transactionFromTransactionDraft(context, this._storage, t),
			),
		);
		const interfaceInteractions = await Promise.all(
			(draft.interfaceInteractions || []).map(async (interaction) => {
				const customFields = await createCustomFields(
					interaction,
					context.projectKey,
					this._storage,
				);
				return customFields!;
			}),
		);

		const resource: Payment = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			amountPlanned: createCentPrecisionMoney(draft.amountPlanned),
			paymentMethodInfo: { ...draft.paymentMethodInfo!, custom: undefined },
			paymentStatus: draft.paymentStatus
				? {
						...draft.paymentStatus,
						state: draft.paymentStatus.state
							? await getReferenceFromResourceIdentifier<StateReference>(
									draft.paymentStatus.state,
									context.projectKey,
									this._storage,
								)
							: undefined,
					}
				: {},
			transactions,
			interfaceInteractions,
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};

		return await this.saveNew(context, resource);
	}
}
