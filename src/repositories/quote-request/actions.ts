import type {
	InvalidJsonInputError,
	QuoteRequest,
	QuoteRequestSetCustomFieldAction,
	QuoteRequestSetCustomTypeAction,
	QuoteRequestTransitionStateAction,
	QuoteRequestUpdateAction,
	StateReference,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler } from "../abstract.ts";
import { getReferenceFromResourceIdentifier } from "../helpers.ts";

export class QuoteRequestUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<QuoteRequest, QuoteRequestUpdateAction>>
{
	setCustomField(
		context: RepositoryContext,
		resource: QuoteRequest,
		{ name, value }: QuoteRequestSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<QuoteRequest>,
		{ type, fields }: QuoteRequestSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	async transitionState(
		context: RepositoryContext,
		resource: Writable<QuoteRequest>,
		{ state, force }: QuoteRequestTransitionStateAction,
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
