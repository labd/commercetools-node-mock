import { Router } from "express";
import { CartDiscountRepository } from "../repositories/cart-discount";
import AbstractService from "./abstract";

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
