import type {
	Payment,
	PaymentDraft,
	StateReference,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import {
	createCentPrecisionMoney,
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers";
import { PaymentUpdateHandler } from "./actions";
import { transactionFromTransactionDraft } from "./helpers";

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
			paymentMethodInfo: draft.paymentMethodInfo!,
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
