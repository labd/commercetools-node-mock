import type {
	StagedQuote,
	StagedQuoteDraft,
} from "@commercetools/platform-sdk";
import type { AbstractStorage } from "~src/storage";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

export class StagedQuoteRepository extends AbstractResourceRepository<"staged-quote"> {
	constructor(storage: AbstractStorage) {
		super("staged-quote", storage);
	}

	create(context: RepositoryContext, draft: StagedQuoteDraft): StagedQuote {
		throw new Error("not implemented");
	}
}
