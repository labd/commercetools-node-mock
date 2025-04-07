import type {
	InvalidJsonInputError,
	StagedQuote,
	StagedQuoteSetCustomFieldAction,
	StagedQuoteSetCustomTypeAction,
	StagedQuoteTransitionStateAction,
	StagedQuoteUpdateAction,
	StateReference,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import type { Writable } from "~src/types";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler } from "../abstract";
import { getReferenceFromResourceIdentifier } from "../helpers";

export class StagedQuoteUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<StagedQuote, StagedQuoteUpdateAction>>
{
	setCustomField(
		context: RepositoryContext,
		resource: StagedQuote,
		{ name, value }: StagedQuoteSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<StagedQuote>,
		{ type, fields }: StagedQuoteSetCustomTypeAction,
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
		resource: Writable<StagedQuote>,
		{ state, force }: StagedQuoteTransitionStateAction,
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
