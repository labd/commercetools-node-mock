import type { Router } from "express";
import type { ShoppingListRepository } from "../repositories/shopping-list/index.ts";
import AbstractService from "./abstract.ts";

export class MyShoppingListService extends AbstractService {
	public repository: ShoppingListRepository;

	constructor(parent: Router, repository: ShoppingListRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me/shopping-lists";
	}
}
