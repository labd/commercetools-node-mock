import type { FastifyInstance } from "fastify";
import type { ShoppingListRepository } from "../repositories/shopping-list/index.ts";
import AbstractMyService, { type MyResourceRules } from "./abstract-my.ts";

export class MyShoppingListService extends AbstractMyService {
	public repository: ShoppingListRepository;

	protected myRules: MyResourceRules = {
		customerWhere: (customerId) => `customer(id="${customerId}")`,
		anonymousWhere: (anonymousId) => `anonymousId="${anonymousId}"`,
		customerOf: (list) => list.customer?.id,
		anonymousOf: (list) => list.anonymousId,
		stampDraft: (draft, identity) =>
			identity.type === "customer"
				? {
						...draft,
						customer: draft.customer ?? {
							typeId: "customer",
							id: identity.id,
						},
					}
				: { ...draft, anonymousId: draft.anonymousId ?? identity.id },
	};

	constructor(parent: FastifyInstance, repository: ShoppingListRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me/shopping-lists";
	}
}
