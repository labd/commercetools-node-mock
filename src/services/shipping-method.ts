import { Request, Response, Router } from "express";
import { queryParamsValue } from "../helpers";
import { getRepositoryContext } from "../repositories/helpers";
import { ShippingMethodRepository } from "../repositories/shipping-method";
import AbstractService from "./abstract";

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
			return response.status(400).send();
		}
		const result = this.repository.matchingCart(
			getRepositoryContext(request),
			cartId,
			{
				expand: this._parseParam(request.query.expand),
			},
		);
		return response.status(200).send(result);
	}
}
