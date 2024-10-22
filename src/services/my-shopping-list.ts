import type { Router } from "express";
import type { ShoppingListRepository } from "../repositories/shopping-list";
import AbstractService from "./abstract";

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
