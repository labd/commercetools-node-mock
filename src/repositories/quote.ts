import type {
	Quote,
	QuoteDraft,
	QuoteUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "../types";
import { AbstractResourceRepository, RepositoryContext } from "./abstract";

export class QuoteRepository extends AbstractResourceRepository<"quote"> {
	getTypeId() {
		return "quote" as const;
	}

	create(context: RepositoryContext, draft: QuoteDraft): Quote {
		throw new Error("not implemented");
	}

	actions: Partial<
		Record<
			QuoteUpdateAction["action"],
			(
				context: RepositoryContext,
				resource: Writable<Quote>,
				action: any,
			) => void
		>
	> = {};
}
