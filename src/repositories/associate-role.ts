import type { AssociateRole, AssociateRoleAddPermissionAction, AssociateRoleChangeBuyerAssignableAction, AssociateRoleDraft, AssociateRoleRemovePermissionAction, AssociateRoleSetCustomFieldAction, AssociateRoleSetNameAction, AssociateRoleSetPermissionsAction, Permission } from '@commercetools/platform-sdk'
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from './abstract.js'
import { getBaseResourceProperties } from '../helpers.js'
import { createCustomFields } from './helpers.js'
import { Writable } from '../types.js'

export class AssociateRoleRepository extends AbstractResourceRepository<'associate-role'> {
	getTypeId() {
		return 'associate-role' as const
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
		}

		this.saveNew(context, resource)

		return resource
	}

	actions = {
		setName: (
			context: RepositoryContext,
			resource: Writable<AssociateRole>,
			{ name }: AssociateRoleSetNameAction,
		) => {
			resource.name = name
		},
		setPermissions: (
			context: RepositoryContext,
			resource: Writable<AssociateRole>,
			{ permissions }: AssociateRoleSetPermissionsAction,
		) => {
			resource.permissions = permissions || []
		},
		setBuyerAssignable: (
			context: RepositoryContext,
			resource: Writable<AssociateRole>,
			{ buyerAssignable }: AssociateRoleChangeBuyerAssignableAction,
		) => {
			resource.buyerAssignable = buyerAssignable
		},
		setCustomFields: (
			context: RepositoryContext,
			resource: Writable<AssociateRole>,
			{ name, value }: AssociateRoleSetCustomFieldAction,
		) => {
			if (!resource.custom) {
				return
			}

			if (value === null) {
				delete resource.custom.fields[name]
			} else {
				resource.custom.fields[name] = value
			}
		},
		addPermission: (
			context: RepositoryContext,
			resource: Writable<AssociateRole>,
			{ permission }: AssociateRoleAddPermissionAction,
		) => {
			if (!resource.permissions) {
				resource.permissions = [permission]
			} else {
				resource.permissions.push(permission)
			}
		},
		removePermission: (
			context: RepositoryContext,
			resource: Writable<AssociateRole>,
			{ permission }: AssociateRoleRemovePermissionAction,
		) => {
			if (!resource.permissions) {return}

			resource.permissions = resource.permissions.filter((p) => {
				p !== permission
			})
		}
	}
}
