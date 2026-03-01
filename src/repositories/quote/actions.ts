import type {
	InvalidJsonInputError,
	Quote,
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
	setCustomField(
		context: RepositoryContext,
		resource: Quote,
		{ name, value }: QuoteSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Quote>,
		{ type, fields }: QuoteSetCustomTypeAction,
	) {
		this._setCustomType(context, resource, { type, fields });
	}

	transitionState(
		context: RepositoryContext,
		resource: Writable<Quote>,
		{ state, force }: QuoteTransitionStateAction,
	) {
		let stateReference: StateReference | undefined;
		if (state) {
			stateReference = getReferenceFromResourceIdentifier<StateReference>(
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

		return resource;
	}
}
