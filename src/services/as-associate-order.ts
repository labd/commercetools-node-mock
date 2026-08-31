import type { Cart } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
	ORDER_PERMISSIONS,
	permissionFor,
	requirePermission,
} from "#src/associate-permissions.ts";
import type { AsAssociateOrderRepository } from "#src/repositories/as-associate.ts";
import { getRepositoryContext } from "#src/repositories/helpers.ts";
import AbstractAssociateService, {
	type AssociateResourceRules,
} from "./abstract-associate.ts";

export class AsAssociateOrderService extends AbstractAssociateService {
	public repository: AsAssociateOrderRepository;

	protected rules: AssociateResourceRules = {
		view: ORDER_PERMISSIONS.view,
		update: ORDER_PERMISSIONS.update,
		businessUnitWhere: (key) => `businessUnit(key="${key}")`,
		ownerWhere: (associateId) => `customerId="${associateId}"`,
		ownerOf: (order) => order.customerId,
		businessUnitOf: (order) => order.businessUnit?.key,
	};

	constructor(parent: FastifyInstance, repository: AsAssociateOrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "orders";
	}

	/**
	 * An order is created from a cart, so whether this is `My` or `Others` is
	 * decided by who owns that cart rather than by anything in the draft.
	 */
	protected override async authorizeCreate(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		draft: unknown,
	): Promise<unknown> {
		const context = getRepositoryContext(request);
		const associate = await this.associateContext(request);

		const cartId = (draft as { cart?: { id?: string } }).cart?.id;
		const cart = cartId
			? ((await this.repository.storage.get(
					context.projectKey,
					"cart",
					cartId,
				)) as Cart | null)
			: null;

		const owner = cart?.customerId;
		requirePermission(
			context,
			associate,
			permissionFor(
				ORDER_PERMISSIONS.create,
				owner === associate.associateId ? "my" : "others",
			),
			"create",
			owner,
		);

		return draft;
	}

	registerRoutes(parent: FastifyInstance) {
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("/", this.get.bind(this));
				instance.get("/:id", this.getWithId.bind(this));

				instance.delete("/:id", this.deleteWithId.bind(this));

				instance.post("/", this.post.bind(this));
				instance.post("/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}
}
