import type {
	InvalidJsonInputError,
	Quote,
	QuoteSetCustomFieldAction,
	QuoteSetCustomTypeAction,
	QuoteTransitionStateAction,
	QuoteUpdateAction,
	StateReference,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import type { Writable } from "~src/types";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler } from "../abstract";
import { getReferenceFromResourceIdentifier } from "../helpers";

export class QuoteUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Quote, QuoteUpdateAction>>
{
	setCustomField(
		context: RepositoryContext,
		resource: Quote,
		{ name, value }: QuoteSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Quote>,
		{ type, fields }: QuoteSetCustomTypeAction,
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
		resource: Writable<Quote>,
		{ state, force }: QuoteTransitionStateAction,
	) {
		let stateReference: StateReference | undefined = undefined;
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
