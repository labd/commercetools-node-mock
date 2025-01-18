import type { Quote, QuoteDraft } from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

export class QuoteRepository extends AbstractResourceRepository<"quote"> {
	constructor(config: Config) {
		super("quote", config);
	}

	create(context: RepositoryContext, draft: QuoteDraft): Quote {
		throw new Error("not implemented");
	}
}
