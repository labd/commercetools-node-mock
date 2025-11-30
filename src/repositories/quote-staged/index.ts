import type {
	StagedQuote,
	StagedQuoteDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { StagedQuoteUpdateHandler } from "./actions.ts";

export class StagedQuoteRepository extends AbstractResourceRepository<"staged-quote"> {
	constructor(config: Config) {
		super("staged-quote", config);
		this.actions = new StagedQuoteUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: StagedQuoteDraft): StagedQuote {
		const quoteRequest = this._storage.getByResourceIdentifier<"quote-request">(
			context.projectKey,
			draft.quoteRequest,
		);

		if (!quoteRequest.cart) {
			throw new Error("Cannot find quote request");
		}

		const cart = this._storage.getByResourceIdentifier<"cart">(
			context.projectKey,
			quoteRequest.cart,
		);

		const resource: StagedQuote = {
			...getBaseResourceProperties(),
			stagedQuoteState: "InProgress",
			quoteRequest: {
				typeId: "quote-request",
				id: quoteRequest.id,
			},
			quotationCart: {
				typeId: "cart",
				id: cart.id,
			},
		};

		return resource;
	}
}
