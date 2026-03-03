import type {
	AttributeDefinition,
	AttributeDefinitionDraft,
	AttributeType,
	InvalidOperationError,
	ProductType,
	ProductTypeAddAttributeDefinitionAction,
	ProductTypeChangeAttributeOrderByNameAction,
	ProductTypeChangeDescriptionAction,
	ProductTypeChangeLabelAction,
	ProductTypeChangeLocalizedEnumValueLabelAction,
	ProductTypeChangeNameAction,
	ProductTypeDraft,
	ProductTypeRemoveAttributeDefinitionAction,
	ProductTypeRemoveEnumValuesAction,
	ProductTypeSetKeyAction,
	ProductTypeUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { ProductTypeDraftSchema } from "#src/schemas/generated/product-type.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";

export class ProductTypeRepository extends AbstractResourceRepository<"product-type"> {
	constructor(config: Config) {
		super("product-type", config);
		this.actions = new ProductTypeUpdateHandler(config.storage);
		this.draftSchema = ProductTypeDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: ProductTypeDraft,
	): Promise<ProductType> {
		const resource: ProductType = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.name,
			description: draft.description,
			attributes: (draft.attributes ?? []).map((a) =>
				attributeDefinitionFromAttributeDefinitionDraft(context, a),
			),
		};

		return await this.saveNew(context, resource);
	}
}

const attributeDefinitionFromAttributeDefinitionDraft = (
	_context: RepositoryContext,
	draft: AttributeDefinitionDraft,
): AttributeDefinition => ({
	...draft,
	level: draft.level ?? "Variant",
	attributeConstraint: draft.attributeConstraint ?? "None",
	inputHint: draft.inputHint ?? "SingleLine",
	inputTip:
		draft.inputTip && Object.keys(draft.inputTip).length > 0
			? draft.inputTip
			: undefined,
	isSearchable: draft.isSearchable ?? true,
});

class ProductTypeUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<ProductType, ProductTypeUpdateAction>>
{
	addAttributeDefinition(
		context: RepositoryContext,
		resource: Writable<ProductType>,
		{ attribute }: ProductTypeAddAttributeDefinitionAction,
	) {
		resource.attributes?.push(
			attributeDefinitionFromAttributeDefinitionDraft(context, attribute),
		);
	}

	changeAttributeOrderByName(
		context: RepositoryContext,
		resource: Writable<ProductType>,
		{ attributeNames }: ProductTypeChangeAttributeOrderByNameAction,
	) {
		const attrs = new Map(
			resource.attributes?.map((item) => [item.name, item]),
		);
		const result: AttributeDefinition[] = [];
		let current = resource.attributes;

		attributeNames.forEach((attrName) => {
			const attr = attrs.get(attrName);
			if (attr === undefined) {
				throw new CommercetoolsError<InvalidOperationError>(
					{
						code: "InvalidOperation",
						message:
							"Adding new attribute definitions is not fully supported yet",
					},
					400,
				);
			}
			result.push(attr);

			// Remove from current items
			current = current?.filter((f) => f.name !== attrName);
		});

		resource.attributes = result;
		// Add attrs which were not specified in the order as last items. Not
		// sure if this follows commercetools
		if (current) {
			resource.attributes.push(...current);
		}
	}

	changeLabel(
		context: RepositoryContext,
		resource: Writable<ProductType>,
		{ attributeName, label }: ProductTypeChangeLabelAction,
	) {
		resource.attributes?.forEach((value) => {
			if (value.name === attributeName) {
				value.label = label;
			}
		});
	}

	changeLocalizedEnumValueLabel(
		context: RepositoryContext,
		resource: Writable<ProductType>,
		{ attributeName, newValue }: ProductTypeChangeLocalizedEnumValueLabelAction,
	) {
		const updateAttributeType = (type: Writable<AttributeType>) => {
			switch (type.name) {
				case "lenum":
					type.values.forEach((v) => {
						if (v.key === newValue.key) {
							v.label = newValue.label;
						}
					});
					return;
				case "set":
					updateAttributeType(type.elementType);
					return;
			}
		};

		resource.attributes?.forEach((value) => {
			if (value.name === attributeName) {
				updateAttributeType(value.type);
			}
		});
	}

	removeAttributeDefinition(
		context: RepositoryContext,
		resource: Writable<ProductType>,
		{ name }: ProductTypeRemoveAttributeDefinitionAction,
	) {
		resource.attributes = resource.attributes?.filter((f) => f.name !== name);
	}

	removeEnumValues(
		context: RepositoryContext,
		resource: Writable<ProductType>,
		{ attributeName, keys }: ProductTypeRemoveEnumValuesAction,
	) {
		resource.attributes?.forEach((attr) => {
			if (attr.name === attributeName) {
				if (attr.type.name === "enum") {
					attr.type.values = attr.type.values.filter(
						(v) => !keys.includes(v.key),
					);
				}

				if (attr.type.name === "set") {
					if (attr.type.elementType.name === "enum") {
						attr.type.elementType.values = attr.type.elementType.values.filter(
							(v) => !keys.includes(v.key),
						);
					}
				}
			}
		});
	}

	setKey(
		_context: RepositoryContext,
		resource: Writable<ProductType>,
		{ key }: ProductTypeSetKeyAction,
	) {
		resource.key = key;
	}

	changeName(
		_context: RepositoryContext,
		resource: Writable<ProductType>,
		{ name }: ProductTypeChangeNameAction,
	) {
		resource.name = name;
	}

	changeDescription(
		_context: RepositoryContext,
		resource: Writable<ProductType>,
		{ description }: ProductTypeChangeDescriptionAction,
	) {
		resource.description = description;
	}
}
