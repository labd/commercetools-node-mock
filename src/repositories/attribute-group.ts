import type {
	AttributeGroup,
	AttributeGroupChangeNameAction,
	AttributeGroupDraft,
	AttributeGroupSetAttributesAction,
	AttributeGroupSetDescriptionAction,
	AttributeGroupSetKeyAction,
	AttributeGroupUpdateAction,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import { AbstractStorage } from "../storage/abstract";
import { Writable } from "../types";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	UpdateHandlerInterface,
	type RepositoryContext,
} from "./abstract";

export class AttributeGroupRepository extends AbstractResourceRepository<"attribute-group"> {
	constructor(storage: AbstractStorage) {
		super("attribute-group", storage);
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
	setAttributes(
		_context: RepositoryContext,
		resource: Writable<AttributeGroup>,
		{ attributes }: AttributeGroupSetAttributesAction,
	) {
		resource.attributes = attributes;
	}

	changeName(
		_context: RepositoryContext,
		resource: Writable<AttributeGroup>,
		{ name }: AttributeGroupChangeNameAction,
	) {
		resource.name = name;
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
