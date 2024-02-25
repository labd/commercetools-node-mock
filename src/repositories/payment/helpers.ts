import { Transaction, TransactionDraft } from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import { AbstractStorage } from "~src/storage";
import { RepositoryContext } from "../abstract";
import { createCentPrecisionMoney, createCustomFields } from "../helpers";

export const transactionFromTransactionDraft = (
	context: RepositoryContext,
	storage: AbstractStorage,
	draft: TransactionDraft,
): Transaction => ({
	...draft,
	id: uuidv4(),
	amount: createCentPrecisionMoney(draft.amount),
	custom: createCustomFields(draft.custom, context.projectKey, storage),
	state: draft.state ?? "Initial", // Documented as default
});
