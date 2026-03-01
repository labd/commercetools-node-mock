import type {
	InvalidJsonInputError,
	InvalidOperationError,
	Quote,
	QuoteSetCustomFieldAction,
	QuoteSetCustomTypeAction,
	QuoteTransitionStateAction,
	QuoteUpdateAction,
	ReferencedResourceNotFoundError,
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
		if (!resource.custom) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "Resource has no custom field",
				},
				400,
			);
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
				throw new CommercetoolsError<ReferencedResourceNotFoundError>(
					{
						code: "ReferencedResourceNotFound",
						message: `Type ${type} not found`,
						typeId: "type",
					},
					400,
				);
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
