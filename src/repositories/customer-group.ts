import type {
	CustomerGroup,
	CustomerGroupChangeNameAction,
	CustomerGroupDraft,
	CustomerGroupSetCustomFieldAction,
	CustomerGroupSetCustomTypeAction,
	CustomerGroupSetKeyAction,
	CustomerGroupUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CustomerGroupDraftSchema } from "#src/schemas/generated/customer-group.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";
import { createCustomFields } from "./helpers.ts";

export class CustomerGroupRepository extends AbstractResourceRepository<"customer-group"> {
	constructor(config: Config) {
		super("customer-group", config);
		this.actions = new CustomerGroupUpdateHandler(config.storage);
		this.draftSchema = CustomerGroupDraftSchema;
	}

	create(context: RepositoryContext, draft: CustomerGroupDraft): CustomerGroup {
		const resource: CustomerGroup = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.groupName,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}
}

class CustomerGroupUpdateHandler
	extends AbstractUpdateHandler
	implements UpdateHandlerInterface<CustomerGroup, CustomerGroupUpdateAction>
{
	changeName(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ name }: CustomerGroupChangeNameAction,
	) {
		resource.name = name;
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ name, value }: CustomerGroupSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ type, fields }: CustomerGroupSetCustomTypeAction,
	) {
		this._setCustomType(context, resource, { type, fields });
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ key }: CustomerGroupSetKeyAction,
	) {
		resource.key = key;
	}
}
