import type {
	ResourceNotFoundError,
	StagedQuote,
	StagedQuoteDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { StagedQuoteDraftSchema } from "#src/schemas/generated/staged-quote.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
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

		if (!quoteRequest.cart) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "Cannot find quote request",
				},
				404,
			);
		}

		const cart = await this._storage.getByResourceIdentifier<"cart">(
			context.projectKey,
			quoteRequest.cart,
		);

		const resource: StagedQuote = {
			...getBaseResourceProperties(context.clientId),
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
