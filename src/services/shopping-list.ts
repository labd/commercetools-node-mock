import type { FastifyInstance } from "fastify";
import type { ShoppingListRepository } from "../repositories/shopping-list/index.ts";
import AbstractService, { singleStoreScope } from "./abstract.ts";

export class ShoppingListService extends AbstractService {
	public repository: ShoppingListRepository;

	protected override storeScope = singleStoreScope;

	constructor(parent: FastifyInstance, repository: ShoppingListRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "shopping-lists";
	}
}
