import type {
	CustomerGroup,
	CustomerGroupChangeNameAction,
	CustomerGroupDraft,
	CustomerGroupSetCustomFieldAction,
	CustomerGroupSetCustomTypeAction,
	CustomerGroupSetKeyAction,
	CustomerGroupUpdateAction,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import { AbstractStorage } from "../storage/abstract";
import type { Writable } from "../types";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	UpdateHandlerInterface,
	type RepositoryContext,
} from "./abstract";
import { createCustomFields } from "./helpers";

export class CustomerGroupRepository extends AbstractResourceRepository<"customer-group"> {
	constructor(storage: AbstractStorage) {
		super("customer-group", storage);
		this.actions = new CustomerGroupUpdateHandler(storage);
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
	setKey(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ key }: CustomerGroupSetKeyAction,
	) {
		resource.key = key;
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<CustomerGroup>,
		{ name }: CustomerGroupChangeNameAction,
	) {
		resource.name = name;
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
}
