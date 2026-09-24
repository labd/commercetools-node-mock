import type {
	InvalidJsonInputError,
	InvalidOperationError,
	Quote,
	QuoteChangeQuoteStateAction,
	QuoteRequestQuoteRenegotiationAction,
	QuoteSetCustomFieldAction,
	QuoteSetCustomTypeAction,
	QuoteTransitionStateAction,
	QuoteUpdateAction,
	StateReference,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler } from "../abstract.ts";
import { getReferenceFromResourceIdentifier } from "../helpers.ts";

export class QuoteUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Quote, QuoteUpdateAction>>
{
	changeQuoteState(
		context: RepositoryContext,
		resource: Writable<Quote>,
		{ quoteState }: QuoteChangeQuoteStateAction,
	) {
		// Only a renegotiation request may decline a quote for renegotiation,
		// because that is what carries the buyer's comment
		if (quoteState === "DeclinedForRenegotiation") {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message:
						"The state 'DeclinedForRenegotiation' can only be set by the 'requestQuoteRenegotiation' update action.",
				},
				400,
			);
		}

		resource.quoteState = quoteState;
	}

	requestQuoteRenegotiation(
		context: RepositoryContext,
		resource: Writable<Quote>,
		{ buyerComment }: QuoteRequestQuoteRenegotiationAction,
	) {
		if (resource.quoteState !== "Pending") {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: `The quote with ID '${resource.id}' cannot be renegotiated because it is in state '${resource.quoteState}'.`,
				},
				400,
			);
		}

		resource.quoteState = "DeclinedForRenegotiation";
		resource.buyerComment = buyerComment;
	}

	setCustomField(
		context: RepositoryContext,
		resource: Quote,
		{ name, value }: QuoteSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<Quote>,
		{ type, fields }: QuoteSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	async transitionState(
		context: RepositoryContext,
		resource: Writable<Quote>,
		{ state, force }: QuoteTransitionStateAction,
	) {
		let stateReference: StateReference | undefined;
		if (state) {
			stateReference = await getReferenceFromResourceIdentifier<StateReference>(
				state,
				context.projectKey,
				this._storage,
			);
			resource.state = stateReference;
		} else {
			throw new CommercetoolsError<InvalidJsonInputError>(
				{
					code: "InvalidJsonInput",
					message: "Request body does not contain valid JSON.",
					detailedErrorMessage: "actions -> state: Missing required value",
				},
				400,
			);
		}
	}
}
