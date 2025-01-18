import type {
	QuoteRequest,
	QuoteRequestDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

export class QuoteRequestRepository extends AbstractResourceRepository<"quote-request"> {
	constructor(config: Config) {
		super("quote-request", config);
	}

	create(context: RepositoryContext, draft: QuoteRequestDraft): QuoteRequest {
		throw new Error("not implemented");
	}
}
