import type {
	InvalidJsonInputError,
	StagedQuote,
	StagedQuoteChangeStagedQuoteStateAction,
	StagedQuoteSetCustomFieldAction,
	StagedQuoteSetCustomTypeAction,
	StagedQuoteSetSellerCommentAction,
	StagedQuoteSetValidToAction,
	StagedQuoteTransitionStateAction,
	StagedQuoteUpdateAction,
	StateReference,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler } from "../abstract.ts";
import { getReferenceFromResourceIdentifier } from "../helpers.ts";

export class StagedQuoteUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<StagedQuote, StagedQuoteUpdateAction>>
{
	changeStagedQuoteState(
		context: RepositoryContext,
		resource: Writable<StagedQuote>,
		{ stagedQuoteState }: StagedQuoteChangeStagedQuoteStateAction,
	) {
		resource.stagedQuoteState = stagedQuoteState;
	}

	setCustomField(
		context: RepositoryContext,
		resource: StagedQuote,
		{ name, value }: StagedQuoteSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<StagedQuote>,
		{ type, fields }: StagedQuoteSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	setSellerComment(
		context: RepositoryContext,
		resource: Writable<StagedQuote>,
		{ sellerComment }: StagedQuoteSetSellerCommentAction,
	) {
		resource.sellerComment = sellerComment;
	}

	setValidTo(
		context: RepositoryContext,
		resource: Writable<StagedQuote>,
		{ validTo }: StagedQuoteSetValidToAction,
	) {
		resource.validTo = validTo;
	}

	async transitionState(
		context: RepositoryContext,
		resource: Writable<StagedQuote>,
		{ state, force }: StagedQuoteTransitionStateAction,
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
