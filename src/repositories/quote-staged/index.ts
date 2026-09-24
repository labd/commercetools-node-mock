import type {
	Cart,
	InvalidOperationError,
	QuoteRequest,
	StagedQuote,
	StagedQuoteDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { StagedQuoteDraftSchema } from "#src/schemas/generated/staged-quote.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { checkConcurrentModification } from "../errors.ts";
import { StagedQuoteUpdateHandler } from "./actions.ts";

export class StagedQuoteRepository extends AbstractResourceRepository<"staged-quote"> {
	constructor(config: Config) {
		super("staged-quote", config);
		this.actions = new StagedQuoteUpdateHandler(config.storage);
		this.draftSchema = StagedQuoteDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: StagedQuoteDraft,
	): Promise<StagedQuote> {
		const quoteRequest =
			await this._storage.getByResourceIdentifier<"quote-request">(
				context.projectKey,
				draft.quoteRequest,
			);

		checkConcurrentModification(
			quoteRequest.version,
			draft.quoteRequestVersion,
			quoteRequest.id,
		);

		if (quoteRequest.quoteRequestState !== "Submitted") {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: `A staged quote cannot be created from the quote request with ID '${quoteRequest.id}' because it is in state '${quoteRequest.quoteRequestState}'.`,
				},
				400,
			);
		}

		const quotationCart = await this.createQuotationCart(context, quoteRequest);

		const resource: StagedQuote = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			stagedQuoteState: "InProgress",
			customer: quoteRequest.customer,
			quoteRequest: {
				typeId: "quote-request",
				id: quoteRequest.id,
			},
			quotationCart: {
				typeId: "cart",
				id: quotationCart.id,
			},
			businessUnit: quoteRequest.businessUnit,
			store: quoteRequest.store,
			custom: quoteRequest.custom,
		};

		const staged = await this.saveNew(context, resource);

		if (draft.quoteRequestStateToAccepted) {
			const accepted = {
				...quoteRequest,
				quoteRequestState: "Accepted",
				version: quoteRequest.version + 1,
				lastModifiedAt: new Date().toISOString(),
			} as Writable<QuoteRequest>;
			await this._storage.add(context.projectKey, "quote-request", accepted);
		}

		return staged;
	}

	/**
	 * The cart the seller prices the offer in. It is a copy of the requested
	 * cart, so editing the offer leaves what the buyer asked for untouched.
	 */
	private async createQuotationCart(
		context: RepositoryContext,
		quoteRequest: QuoteRequest,
	): Promise<Cart> {
		if (!quoteRequest.cart) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: `The quote request with ID '${quoteRequest.id}' does not reference a cart.`,
				},
				400,
			);
		}

		const requested = await this._storage.getByResourceIdentifier<"cart">(
			context.projectKey,
			quoteRequest.cart,
		);

		const cart: Writable<Cart> = {
			...structuredClone(requested),
			...getBaseResourceProperties(context.clientId),
			cartState: "Active",
			origin: "Quote",
		};

		return await this._storage.add(context.projectKey, "cart", cart);
	}
}
