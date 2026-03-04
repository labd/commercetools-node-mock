import type { InvalidInputError } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
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

	async matchingCart(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const query = request.query;
		const cartId = queryParamsValue(query.cartId);
		if (!cartId) {
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message: "Missing required parameter: cartId.",
				},
				400,
			);
		}
		const result = await this.repository.matchingCart(
			getRepositoryContext(request),
			cartId,
			{
				expand: this._parseParam(query.expand),
			},
		);
		return reply.status(200).send(result);
	}
}
