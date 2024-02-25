import type { Quote, QuoteDraft } from "@commercetools/platform-sdk";
import { AbstractStorage } from "~src/storage";
import { AbstractResourceRepository, RepositoryContext } from "./abstract";

export class QuoteRepository extends AbstractResourceRepository<"quote"> {
	constructor(storage: AbstractStorage) {
		super("quote", storage);
	}

	create(context: RepositoryContext, draft: QuoteDraft): Quote {
		throw new Error("not implemented");
	}
}
