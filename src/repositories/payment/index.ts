import type {
	Payment,
	PaymentDraft,
	StateReference,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
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
	}

	create(context: RepositoryContext, draft: PaymentDraft): Payment {
		const resource: Payment = {
			...getBaseResourceProperties(),
			key: draft.key,
			amountPlanned: createCentPrecisionMoney(draft.amountPlanned),
			paymentMethodInfo: { ...draft.paymentMethodInfo!, custom: undefined },
			paymentStatus: draft.paymentStatus
				? {
						...draft.paymentStatus,
						state: draft.paymentStatus.state
							? getReferenceFromResourceIdentifier<StateReference>(
									draft.paymentStatus.state,
									context.projectKey,
									this._storage,
								)
							: undefined,
					}
				: {},
			transactions: (draft.transactions || []).map((t) =>
				transactionFromTransactionDraft(context, this._storage, t),
			),
			interfaceInteractions: (draft.interfaceInteractions || []).map(
				(interaction) =>
					createCustomFields(interaction, context.projectKey, this._storage)!,
			),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};

		return this.saveNew(context, resource);
	}
}
