import type {
	StagedQuote,
	StagedQuoteDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import { StagedQuoteUpdateHandler } from "./actions";

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
