import { isDeepStrictEqual } from "node:util";
import type {
	FieldDefinition,
	InvalidOperationError,
	Type,
	TypeAddEnumValueAction,
	TypeAddFieldDefinitionAction,
	TypeChangeEnumValueLabelAction,
	TypeChangeFieldDefinitionOrderAction,
	TypeChangeNameAction,
	TypeRemoveFieldDefinitionAction,
	TypeSetDescriptionAction,
	TypeUpdateAction,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractUpdateHandler } from "../abstract.ts";

type TypeUpdateHandlerMethod<T> = (
	context: RepositoryContext,
	resource: Writable<Type>,
	action: T,
) => void;

type TypeUpdateActions = Partial<{
	[P in TypeUpdateAction as P["action"]]: TypeUpdateHandlerMethod<P>;
}>;

export class TypeUpdateHandler
	extends AbstractUpdateHandler
	implements TypeUpdateActions
{
	addEnumValue(
		context: RepositoryContext,
		resource: Writable<Type>,
		{ fieldName, value }: TypeAddEnumValueAction,
	) {
		resource.fieldDefinitions.forEach((field) => {
			if (field.name === fieldName) {
				// TODO, should be done better i suppose
				if (field.type.name === "Enum") {
					field.type.values.push(value);
				} else if (
					field.type.name === "Set" &&
					field.type.elementType.name === "Enum"
				) {
					field.type.elementType.values.push(value);
				} else {
					throw new Error("Type is not a Enum (or Set of Enum)");
				}
			}
		});
	}

	addFieldDefinition(
		context: RepositoryContext,
		resource: Writable<Type>,
		{ fieldDefinition }: TypeAddFieldDefinitionAction,
	) {
		resource.fieldDefinitions.push(fieldDefinition);
	}

	changeEnumValueLabel(
		context: RepositoryContext,
		resource: Writable<Type>,
		{ fieldName, value }: TypeChangeEnumValueLabelAction,
	) {
		resource.fieldDefinitions.forEach((field) => {
			if (field.name === fieldName) {
				// TODO, should be done better i suppose
				if (field.type.name === "Enum") {
					field.type.values.forEach((v) => {
						if (v.key === value.key) {
							v.label = value.label;
						}
					});
				} else if (
					field.type.name === "Set" &&
					field.type.elementType.name === "Enum"
				) {
					field.type.elementType.values.forEach((v) => {
						if (v.key === value.key) {
							v.label = value.label;
						}
					});
				} else {
					throw new Error("Type is not a Enum (or Set of Enum)");
				}
			}
		});
	}

	changeFieldDefinitionOrder(
		context: RepositoryContext,
		resource: Writable<Type>,
		{ fieldNames }: TypeChangeFieldDefinitionOrderAction,
	) {
		const fields = new Map(
			resource.fieldDefinitions.map((item) => [item.name, item]),
		);
		const result: FieldDefinition[] = [];
		let current = resource.fieldDefinitions;

		fieldNames.forEach((fieldName) => {
			const field = fields.get(fieldName);
			if (field === undefined) {
				throw new Error("New field");
			}
			result.push(field);

			// Remove from current items
			current = current.filter((f) => f.name !== fieldName);
		});

		if (
			isDeepStrictEqual(
				fieldNames,
				resource.fieldDefinitions.map((item) => item.name),
			)
		) {
			throw new CommercetoolsError<InvalidOperationError>({
				code: "InvalidOperation",
				message: "'fieldDefinitions' has no changes.",
				action: {
					action: "changeFieldDefinitionOrder",
					fieldNames: fieldNames,
				},
			});
		}

		resource.fieldDefinitions = result;
		// Add fields which were not specified in the order as last items. Not
		// sure if this follows commercetools
		resource.fieldDefinitions.push(...current);
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<Type>,
		{ name }: TypeChangeNameAction,
	) {
		resource.name = name;
	}

	removeFieldDefinition(
		context: RepositoryContext,
		resource: Writable<Type>,
		{ fieldName }: TypeRemoveFieldDefinitionAction,
	) {
		resource.fieldDefinitions = resource.fieldDefinitions.filter(
			(f) => f.name !== fieldName,
		);
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<Type>,
		{ description }: TypeSetDescriptionAction,
	) {
		resource.description = description;
	}
}
