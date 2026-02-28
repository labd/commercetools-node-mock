import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { queryParamsValue } from "../helpers.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { ShippingMethodRepository } from "../repositories/shipping-method/index.ts";
import AbstractService from "./abstract.ts";

export class ShippingMethodService extends AbstractService {
	public repository: ShippingMethodRepository;

	constructor(parent: FastifyInstance, repository: ShippingMethodRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "shipping-methods";
	}

	extraRoutes(parent: FastifyInstance) {
		parent.get("/matching-cart", this.matchingCart.bind(this));
	}

	matchingCart(request: FastifyRequest<{ Querystring: Record<string, any> }>, reply: FastifyReply) {
		const query = request.query;
		const cartId = queryParamsValue(query.cartId);
		if (!cartId) {
			return reply.status(400).send();
		}
		const result = this.repository.matchingCart(
			getRepositoryContext(request),
			cartId,
			{
				expand: this._parseParam(query.expand),
			},
		);
		return reply.status(200).send(result);
	}
}
