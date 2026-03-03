import type {
	InvalidOperationError,
	Quote,
	QuoteDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { QuoteDraftSchema } from "#src/schemas/generated/quote.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { QuoteUpdateHandler } from "./actions.ts";

export class QuoteRepository extends AbstractResourceRepository<"quote"> {
	constructor(config: Config) {
		super("quote", config);
		this.actions = new QuoteUpdateHandler(config.storage);
		this.draftSchema = QuoteDraftSchema;
	}

	async create(context: RepositoryContext, draft: QuoteDraft): Promise<Quote> {
		const staged = await this._storage.getByResourceIdentifier<"staged-quote">(
			context.projectKey,
			draft.stagedQuote,
		);

		if (!staged.quotationCart) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "Staged quote does not have a quotation cart",
				},
				400,
			);
		}

		const cart = await this._storage.getByResourceIdentifier<"cart">(
			context.projectKey,
			staged.quotationCart,
		);

		if (!cart.customerId) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "Cart does not have a customer",
				},
				400,
			);
		}

		const resource: Quote = {
			...getBaseResourceProperties(context.clientId),
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
