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
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<QuoteRequest>,
		{ type, fields }: QuoteRequestSetCustomTypeAction,
	) {
		if (!type) {
			resource.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new Error(`Type ${type} not found`);
			}

			resource.custom = {
				type: {
					typeId: "type",
					id: resolvedType.id,
				},
				fields: fields || {},
			};
		}
	}

	transitionState(
		context: RepositoryContext,
		resource: Writable<QuoteRequest>,
		{ state, force }: QuoteRequestTransitionStateAction,
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
