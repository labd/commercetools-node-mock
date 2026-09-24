import type {
	InvalidOperationError,
	Quote,
	QuoteDraft,
	StagedQuote,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { QuoteDraftSchema } from "#src/schemas/generated/quote.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { checkConcurrentModification } from "../errors.ts";
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

		checkConcurrentModification(
			staged.version,
			draft.stagedQuoteVersion,
			staged.id,
		);

		if (staged.stagedQuoteState !== "InProgress") {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: `A quote cannot be created from the staged quote with ID '${staged.id}' because it is in state '${staged.stagedQuoteState}'.`,
				},
				400,
			);
		}

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
			key: draft.key,
			quoteState: "Pending",
			quoteRequest: staged.quoteRequest,
			stagedQuote: {
				typeId: "staged-quote",
				id: staged.id,
			},
			customer: {
				typeId: "customer",
				id: cart.customerId,
			},
			customerGroup: cart.customerGroup,
			businessUnit: staged.businessUnit,
			store: staged.store,
			validTo: staged.validTo,
			sellerComment: staged.sellerComment,
			lineItems: cart.lineItems,
			customLineItems: cart.customLineItems,
			directDiscounts: cart.directDiscounts,
			shippingInfo: cart.shippingInfo,
			country: cart.country,
			priceRoundingMode: cart.priceRoundingMode,
			totalPrice: cart.totalPrice,
			taxedPrice: cart.taxedPrice,
			taxMode: cart.taxMode,
			taxRoundingMode: cart.taxRoundingMode,
			taxCalculationMode: cart.taxCalculationMode,
			billingAddress: cart.billingAddress,
			shippingAddress: cart.shippingAddress,
			itemShippingAddresses: cart.itemShippingAddresses,
			custom: staged.custom,
		};

		const quote = await this.saveNew(context, resource);

		if (draft.stagedQuoteStateToSent) {
			const sent = {
				...staged,
				stagedQuoteState: "Sent",
				version: staged.version + 1,
				lastModifiedAt: new Date().toISOString(),
			} as Writable<StagedQuote>;
			await this._storage.add(context.projectKey, "staged-quote", sent);
		}

		return quote;
	}
}
