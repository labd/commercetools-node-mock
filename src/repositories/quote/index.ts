import type { Quote, QuoteDraft } from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import { QuoteUpdateHandler } from "./actions";

export class QuoteRepository extends AbstractResourceRepository<"quote"> {
	constructor(config: Config) {
		super("quote", config);
		this.actions = new QuoteUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: QuoteDraft): Quote {
		const staged = this._storage.getByResourceIdentifier<"staged-quote">(
			context.projectKey,
			draft.stagedQuote,
		);

		const cart = this._storage.getByResourceIdentifier<"cart">(
			context.projectKey,
			staged.quotationCart,
		);

		if (!cart.customerId) {
			throw new Error("Cart does not have a customer");
		}

		const resource: Quote = {
			...getBaseResourceProperties(),
			quoteState: "Accepted",
			quoteRequest: staged.quoteRequest,
			lineItems: cart.lineItems,
			customLineItems: cart.customLineItems,
			customer: {
				typeId: "customer",
				id: cart.customerId,
			},
			stagedQuote: {
				typeId: "staged-quote",
				id: staged.id,
			},
			priceRoundingMode: cart.priceRoundingMode,
			totalPrice: cart.totalPrice,
			taxedPrice: cart.taxedPrice,
			taxMode: cart.taxMode,
			taxRoundingMode: cart.taxRoundingMode,
			taxCalculationMode: cart.taxCalculationMode,
			billingAddress: cart.billingAddress,
			shippingAddress: cart.shippingAddress,
		};

		return resource;
	}
}
