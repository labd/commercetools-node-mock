import type { Quote, QuoteDraft } from "@commercetools/platform-sdk";
import type { AbstractStorage } from "~src/storage";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

export class QuoteRepository extends AbstractResourceRepository<"quote"> {
	constructor(storage: AbstractStorage) {
		super("quote", storage);
	}

	create(context: RepositoryContext, draft: QuoteDraft): Quote {
		throw new Error("not implemented");
	}
}
