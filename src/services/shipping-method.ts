import type { Request, Response, Router } from "express";
import { queryParamsValue } from "../helpers.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { ShippingMethodRepository } from "../repositories/shipping-method/index.ts";
import AbstractService from "./abstract.ts";

export class ShippingMethodService extends AbstractService {
	public repository: ShippingMethodRepository;

	constructor(parent: Router, repository: ShippingMethodRepository) {
		super(parent);
		this.repository = repository;
		this.registerRoutes(parent);
	}

	getBasePath() {
		return "shipping-methods";
	}

	extraRoutes(parent: Router) {
		parent.get("/matching-cart", this.matchingCart.bind(this));
	}

	matchingCart(request: Request, response: Response) {
		const cartId = queryParamsValue(request.query.cartId);
		if (!cartId) {
			response.status(400).send();
			return;
		}
		const result = this.repository.matchingCart(
			getRepositoryContext(request),
			cartId,
			{
				expand: this._parseParam(request.query.expand),
			},
		);
		response.status(200).send(result);
		return;
	}
}
