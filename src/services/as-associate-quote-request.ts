import type { Cart } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
	permissionFor,
	QUOTE_REQUEST_PERMISSIONS,
	requirePermission,
} from "#src/associate-permissions.ts";
import type { AsAssociateQuoteRequestRepository } from "#src/repositories/as-associate.ts";
import { getRepositoryContext } from "#src/repositories/helpers.ts";
import AbstractAssociateService, {
	type AssociateResourceRules,
} from "./abstract-associate.ts";

export class AsAssociateQuoteRequestService extends AbstractAssociateService {
	public repository: AsAssociateQuoteRequestRepository;

	protected rules: AssociateResourceRules = {
		view: QUOTE_REQUEST_PERMISSIONS.view,
		update: QUOTE_REQUEST_PERMISSIONS.update,
		businessUnitWhere: (key) => `businessUnit(key="${key}")`,
		ownerWhere: (associateId) => `customer(id="${associateId}")`,
		ownerOf: (quoteRequest) => quoteRequest.customer?.id,
		businessUnitOf: (quoteRequest) => quoteRequest.businessUnit?.key,
	};

	constructor(
		parent: FastifyInstance,
		repository: AsAssociateQuoteRequestRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "quote-requests";
	}

	/**
	 * A quote request is created from a cart, so the cart's owner decides
	 * whether this is `My` or `Others`.
	 */
	protected override async authorizeCreate(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		draft: unknown,
	): Promise<unknown> {
		const context = getRepositoryContext(request);
		const associate = await this.associateContext(request);

		const source = draft as { cartId?: string; cart?: { id?: string } };
		const cartId = source.cartId ?? source.cart?.id;
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
				QUOTE_REQUEST_PERMISSIONS.create,
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
