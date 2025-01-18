import type {
	StagedQuote,
	StagedQuoteDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

export class StagedQuoteRepository extends AbstractResourceRepository<"staged-quote"> {
	constructor(config: Config) {
		super("staged-quote", config);
	}

	create(context: RepositoryContext, draft: StagedQuoteDraft): StagedQuote {
		throw new Error("not implemented");
	}
}
