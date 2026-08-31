import type {
	Permission,
	ResourceNotFoundError,
	UpdateAction,
} from "@commercetools/platform-sdk";
import type { FastifyRequest } from "fastify";
import {
	type AssociateContext,
	type AssociateScope,
	type PermissionPair,
	permissionFor,
	requirePermission,
	resolveAssociateContext,
	viewScope,
} from "#src/associate-permissions.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getRepositoryContext } from "#src/repositories/helpers.ts";
import AbstractService from "./abstract.ts";

type ScopedRequest = FastifyRequest<{ Params: Record<string, string> }>;

/**
 * What a resource needs to declare for the associate scope to police it.
 *
 * The predicates are applied to list requests, so a caller never receives a
 * page that was filtered afterwards; the accessors answer the same questions
 * for a single resource that was resolved by id or key.
 */
export type AssociateResourceRules = {
	/** Permission pair for reading. Omit when any associate of the unit may read. */
	view?: PermissionPair;
	create?: PermissionPair;
	update?: PermissionPair;
	delete?: PermissionPair;

	/** Predicate limiting a query to the business unit named in the path. */
	businessUnitWhere?: (key: string) => string;

	/** Predicate limiting a query to the acting associate's own resources. */
	ownerWhere?: (associateId: string) => string;

	/** The customer a stored resource belongs to. */
	ownerOf?: (resource: any) => string | undefined;

	/** The business unit a stored resource belongs to. */
	businessUnitOf?: (resource: any) => string | undefined;

	/**
	 * The permission a single update action needs, for resources where that
	 * depends on the action rather than on a blanket update permission.
	 */
	actionPermission?: (
		action: UpdateAction,
		scope: AssociateScope,
	) => Permission | undefined;

	/** Permission for creating, when it does not depend on who owns the draft. */
	createPermission?: Permission;

	/** The customer a create draft is for, to tell `My` from `Others`. */
	ownerOfDraft?: (draft: any) => string | undefined;

	/**
	 * Stamps the scope onto a create draft. Without it a resource created
	 * through the associate scope would fall outside the scope that created it.
	 */
	stampDraft?: (
		draft: any,
		scope: { associateId: string; businessUnitKey: string },
	) => any;
};

/**
 * Base for the `as-associate` services: resolves the associate named in the
 * path, then refuses anything their AssociateRoles do not allow.
 */
export default abstract class AbstractAssociateService extends AbstractService {
	protected abstract rules: AssociateResourceRules;

	protected async associateContext(
		request: ScopedRequest,
	): Promise<AssociateContext> {
		return resolveAssociateContext(
			getRepositoryContext(request),
			this.repository.storage,
		);
	}

	protected scopeOf(
		request: ScopedRequest,
		associate: AssociateContext,
		resource: unknown,
	): AssociateScope {
		const owner = this.rules.ownerOf?.(resource);
		return owner && owner === associate.associateId ? "my" : "others";
	}

	protected override async scopeWhere(
		request: ScopedRequest,
	): Promise<string[]> {
		const context = getRepositoryContext(request);
		const associate = await this.associateContext(request);
		const where: string[] = [];

		if (this.rules.businessUnitWhere && context.businessUnitKey) {
			where.push(this.rules.businessUnitWhere(context.businessUnitKey));
		}

		if (this.rules.view) {
			const scope = viewScope(context, associate, this.rules.view);
			if (scope === "my" && this.rules.ownerWhere) {
				where.push(this.rules.ownerWhere(associate.associateId));
			}
		}

		return where;
	}

	protected override async authorizeResource(
		request: ScopedRequest,
		operation: "view" | "update" | "delete",
		resource: unknown,
	): Promise<void> {
		const context = getRepositoryContext(request);
		const associate = await this.associateContext(request);

		// A resource of another business unit is not visible here at all
		const businessUnitKey = this.rules.businessUnitOf?.(resource);
		if (
			this.rules.businessUnitOf &&
			businessUnitKey !== context.businessUnitKey
		) {
			this.throwNotFound(request);
		}

		const scope = this.scopeOf(request, associate, resource);
		const owner = this.rules.ownerOf?.(resource);

		if (operation === "view") {
			if (this.rules.view) {
				requirePermission(
					context,
					associate,
					permissionFor(this.rules.view, scope),
					"view",
					owner,
				);
			}
			return;
		}

		if (operation === "delete") {
			if (this.rules.delete) {
				requirePermission(
					context,
					associate,
					permissionFor(this.rules.delete, scope),
					"delete",
					owner,
				);
			}
			return;
		}

		await this.authorizeUpdate(request, associate, scope, resource, owner);
	}

	protected async authorizeUpdate(
		request: ScopedRequest,
		associate: AssociateContext,
		scope: AssociateScope,
		_resource: unknown,
		owner: string | undefined,
	): Promise<void> {
		const context = getRepositoryContext(request);

		if (this.rules.update) {
			requirePermission(
				context,
				associate,
				permissionFor(this.rules.update, scope),
				"update",
				owner,
			);
			return;
		}

		if (!this.rules.actionPermission) {
			return;
		}

		// Resources without a blanket update permission are policed per action
		const actions = (request.body as { actions?: UpdateAction[] })?.actions;
		for (const action of actions ?? []) {
			const permission = this.rules.actionPermission(action, scope);
			if (permission) {
				requirePermission(context, associate, permission, action.action, owner);
			} else if (this.rules.view) {
				requirePermission(
					context,
					associate,
					permissionFor(this.rules.view, scope),
					action.action,
					owner,
				);
			}
		}
	}

	protected override async authorizeCreate(
		request: ScopedRequest,
		draft: unknown,
	): Promise<unknown> {
		const context = getRepositoryContext(request);
		const associate = await this.associateContext(request);

		if (this.rules.createPermission) {
			requirePermission(
				context,
				associate,
				this.rules.createPermission,
				"create",
			);
		} else if (this.rules.create) {
			const owner = this.rules.ownerOfDraft?.(draft);
			const scope: AssociateScope =
				owner === undefined || owner === associate.associateId
					? "my"
					: "others";
			requirePermission(
				context,
				associate,
				permissionFor(this.rules.create, scope),
				"create",
				owner,
			);
		}

		if (this.rules.stampDraft && context.businessUnitKey) {
			return this.rules.stampDraft(draft, {
				associateId: associate.associateId,
				businessUnitKey: context.businessUnitKey,
			});
		}
		return draft;
	}

	private throwNotFound(request: ScopedRequest): never {
		const { id, key } = request.params;
		throw new CommercetoolsError<ResourceNotFoundError>(
			{
				code: "ResourceNotFound",
				message: id
					? `The Resource with ID '${id}' was not found.`
					: `The Resource with key '${key}' was not found.`,
			},
			404,
		);
	}
}
