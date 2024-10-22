import type {
	QuoteRequest,
	QuoteRequestDraft,
} from "@commercetools/platform-sdk";
import type { AbstractStorage } from "~src/storage";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

export class QuoteRequestRepository extends AbstractResourceRepository<"quote-request"> {
	constructor(storage: AbstractStorage) {
		super("quote-request", storage);
	}

	create(context: RepositoryContext, draft: QuoteRequestDraft): QuoteRequest {
		throw new Error("not implemented");
	}
}
