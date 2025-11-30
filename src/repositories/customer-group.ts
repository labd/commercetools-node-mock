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
	}

	create(context: RepositoryContext, draft: CustomerGroupDraft): CustomerGroup {
		const resource: CustomerGroup = {
			...getBaseResourceProperties(),
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
		if (!resource.custom) {
			return;
		}
		if (value === null) {
			delete resource.custom.fields[name];
		} else {
			resource.custom.fields[name] = value;
		}
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ type, fields }: CustomerGroupSetCustomTypeAction,
	) {
		if (type) {
			resource.custom = createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		} else {
			resource.custom = undefined;
		}
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ key }: CustomerGroupSetKeyAction,
	) {
		resource.key = key;
	}
}
