import type {
	Transaction,
	TransactionDraft,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import type { AbstractStorage } from "#src/storage/index.ts";
import type { RepositoryContext } from "../abstract.ts";
import { createCentPrecisionMoney, createCustomFields } from "../helpers.ts";

export const transactionFromTransactionDraft = async (
	context: RepositoryContext,
	storage: AbstractStorage,
	draft: TransactionDraft,
): Promise<Transaction> => ({
	...draft,
	id: uuidv4(),
	amount: createCentPrecisionMoney(draft.amount),
	custom: await createCustomFields(draft.custom, context.projectKey, storage),
	state: draft.state ?? "Initial", // Documented as default
});
