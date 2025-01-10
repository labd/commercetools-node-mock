import type {
	AssociateRole,
	AssociateRoleAddPermissionAction,
	AssociateRoleChangeBuyerAssignableAction,
	AssociateRoleDraft,
	AssociateRoleRemovePermissionAction,
	AssociateRoleSetCustomFieldAction,
	AssociateRoleSetCustomTypeAction,
	AssociateRoleSetNameAction,
	AssociateRoleSetPermissionsAction,
	AssociateRoleUpdateAction,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import type { AbstractStorage } from "../storage/abstract";
import type { Writable } from "../types";
import type { UpdateHandlerInterface } from "./abstract";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract";
import { createCustomFields } from "./helpers";

export class AssociateRoleRepository extends AbstractResourceRepository<"associate-role"> {
	constructor(storage: AbstractStorage) {
		super("associate-role", storage);
		this.actions = new AssociateRoleUpdateHandler(this._storage);
	}

	create(context: RepositoryContext, draft: AssociateRoleDraft): AssociateRole {
		const resource: AssociateRole = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			buyerAssignable: draft.buyerAssignable || false,
			permissions: draft.permissions || [],
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};

		return this.saveNew(context, resource);
	}
}

class AssociateRoleUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<AssociateRole, AssociateRoleUpdateAction>>
{
	addPermission(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ permission }: AssociateRoleAddPermissionAction,
	) {
		if (!resource.permissions) {
			resource.permissions = [permission];
		} else {
			resource.permissions.push(permission);
		}
	}

	changeBuyerAssignable(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ buyerAssignable }: AssociateRoleChangeBuyerAssignableAction,
	) {
		resource.buyerAssignable = buyerAssignable;
	}

	removePermission(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ permission }: AssociateRoleRemovePermissionAction,
	) {
		if (!resource.permissions) {
			return;
		}

		resource.permissions = resource.permissions.filter((p) => {
			p !== permission;
		});
	}

	setBuyerAssignable(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ buyerAssignable }: AssociateRoleChangeBuyerAssignableAction,
	) {
		resource.buyerAssignable = buyerAssignable;
	}

	setCustomFields(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ name, value }: AssociateRoleSetCustomFieldAction,
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
		resource: Writable<AssociateRole>,
		{ type, fields }: AssociateRoleSetCustomTypeAction,
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

	setName(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ name }: AssociateRoleSetNameAction,
	) {
		resource.name = name;
	}

	setPermissions(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ permissions }: AssociateRoleSetPermissionsAction,
	) {
		resource.permissions = permissions || [];
	}
}
