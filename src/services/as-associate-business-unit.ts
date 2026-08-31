import type { UpdateAction } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
	BUSINESS_UNIT_CREATE_PERMISSION,
	businessUnitActionPermission,
	requirePermission,
	resolveAssociateContext,
} from "#src/associate-permissions.ts";
import type { AsAssociateBusinessUnitRepository } from "#src/repositories/as-associate.ts";
import { getRepositoryContext } from "#src/repositories/helpers.ts";
import AbstractService from "./abstract.ts";

type ScopedRequest = FastifyRequest<{ Params: Record<string, string> }>;

/**
 * `/as-associate/{associateId}/business-units` is the one associate-scoped
 * resource that does not sit inside `in-business-unit/key=`: it lists the units
 * the associate belongs to. So the unit to check permissions against comes from
 * the resource, not from the path.
 */
export class AsAssociateBusinessUnitService extends AbstractService {
	public repository: AsAssociateBusinessUnitRepository;

	constructor(
		parent: FastifyInstance,
		repository: AsAssociateBusinessUnitRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "business-units";
	}

	protected override async scopeWhere(
		request: ScopedRequest,
	): Promise<string[]> {
		const { associateId } = getRepositoryContext(request);
		return associateId ? [`associates(customer(id="${associateId}"))`] : [];
	}

	protected override async authorizeResource(
		request: ScopedRequest,
		operation: "view" | "update" | "delete",
		resource: unknown,
	): Promise<void> {
		const context = getRepositoryContext(request);
		const businessUnit = resource as { key: string };

		// Resolving throws when the caller is not an associate of this unit
		const associate = await resolveAssociateContext(
			context,
			this.repository.storage,
			businessUnit.key,
		);

		if (operation === "view") {
			return;
		}

		const actions =
			(request.body as { actions?: UpdateAction[] })?.actions ?? [];
		for (const action of actions) {
			requirePermission(
				context,
				associate,
				businessUnitActionPermission(action),
				action.action,
			);
		}
	}

	protected override async authorizeCreate(
		request: ScopedRequest,
		draft: unknown,
	): Promise<unknown> {
		const context = getRepositoryContext(request);
		const parentUnit = (draft as { parentUnit?: { key?: string } }).parentUnit;

		const associate = await resolveAssociateContext(
			context,
			this.repository.storage,
			parentUnit?.key,
		);
		requirePermission(
			context,
			associate,
			BUSINESS_UNIT_CREATE_PERMISSION,
			"create",
		);

		return draft;
	}
}
