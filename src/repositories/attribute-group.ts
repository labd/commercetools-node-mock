import type {
	AttributeGroup,
	AttributeGroupChangeNameAction,
	AttributeGroupDraft,
	AttributeGroupSetAttributesAction,
	AttributeGroupSetDescriptionAction,
	AttributeGroupSetKeyAction,
	AttributeGroupUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";

export class AttributeGroupRepository extends AbstractResourceRepository<"attribute-group"> {
	constructor(config: Config) {
		super("attribute-group", config);
		this.actions = new AttributeGroupUpdateHandler(this._storage);
	}

	create(
		context: RepositoryContext,
		draft: AttributeGroupDraft,
	): AttributeGroup {
		const resource: AttributeGroup = {
			...getBaseResourceProperties(),
			name: draft.name,
			description: draft.description,
			key: draft.key,
			attributes: draft.attributes,
		};
		return this.saveNew(context, resource);
	}
}

class AttributeGroupUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<AttributeGroup, AttributeGroupUpdateAction>>
{
	changeName(
		_context: RepositoryContext,
		resource: Writable<AttributeGroup>,
		{ name }: AttributeGroupChangeNameAction,
	) {
		resource.name = name;
	}

	setAttributes(
		_context: RepositoryContext,
		resource: Writable<AttributeGroup>,
		{ attributes }: AttributeGroupSetAttributesAction,
	) {
		resource.attributes = attributes;
	}

	setDescription(
		_context: RepositoryContext,
		resource: Writable<AttributeGroup>,
		{ description }: AttributeGroupSetDescriptionAction,
	) {
		resource.description = description;
	}

	setKey(
		_context: RepositoryContext,
		resource: Writable<AttributeGroup>,
		{ key }: AttributeGroupSetKeyAction,
	) {
		resource.key = key;
	}
}
