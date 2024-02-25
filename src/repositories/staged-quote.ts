import type {
	StagedQuote,
	StagedQuoteDraft,
} from "@commercetools/platform-sdk";
import { AbstractStorage } from "~src/storage";
import { AbstractResourceRepository, RepositoryContext } from "./abstract";

export class StagedQuoteRepository extends AbstractResourceRepository<"staged-quote"> {
	constructor(storage: AbstractStorage) {
		super("staged-quote", storage);
	}

	create(context: RepositoryContext, draft: StagedQuoteDraft): StagedQuote {
		throw new Error("not implemented");
	}
}
