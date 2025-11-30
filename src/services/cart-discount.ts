import type { Router } from "express";
import type { CartDiscountRepository } from "../repositories/cart-discount/index.ts";
import AbstractService from "./abstract.ts";

export class CartDiscountService extends AbstractService {
	public repository: CartDiscountRepository;

	constructor(parent: Router, repository: CartDiscountRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "cart-discounts";
	}
}
