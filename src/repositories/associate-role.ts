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
import type { Config } from "#src/config.ts";
import { AssociateRoleDraftSchema } from "#src/schemas/generated/associate-role.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";
import { createCustomFields } from "./helpers.ts";

export class AssociateRoleRepository extends AbstractResourceRepository<"associate-role"> {
	constructor(config: Config) {
		super("associate-role", config);
		this.actions = new AssociateRoleUpdateHandler(this._storage);
		this.draftSchema = AssociateRoleDraftSchema;
	}

	create(context: RepositoryContext, draft: AssociateRoleDraft): AssociateRole {
		const resource: AssociateRole = {
			...getBaseResourceProperties(context.clientId),
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

		resource.permissions = resource.permissions.filter((p) => p !== permission);
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
		this._setCustomFieldValues(resource, { name, value });
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<AssociateRole>,
		{ type, fields }: AssociateRoleSetCustomTypeAction,
	) {
		this._setCustomType(context, resource, { type, fields });
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
