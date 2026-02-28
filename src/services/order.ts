import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { OrderRepository } from "../repositories/order/index.ts";
import AbstractService from "./abstract.ts";

export class OrderService extends AbstractService {
	public repository: OrderRepository;

	constructor(parent: FastifyInstance, repository: OrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "orders";
	}

	extraRoutes(instance: FastifyInstance) {
		instance.post("/import", this.import.bind(this));
		instance.post("/search", this.search.bind(this));
		instance.get(
			"/order-number=:orderNumber",
			this.getWithOrderNumber.bind(this),
		);
	}

	import(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
		const importDraft = request.body;
		const resource = this.repository.import(
			getRepositoryContext(request),
			importDraft,
		);
		return reply.status(200).send(resource);
	}

	getWithOrderNumber(request: FastifyRequest<{ Params: Record<string, string> }>, reply: FastifyReply) {
		const params = request.params;
		const orderNumber = params.orderNumber;
		const resource = this.repository.getWithOrderNumber(
			getRepositoryContext(request),
			orderNumber,

			// @ts-expect-error
			request.query,
		);
		if (resource) {
			return reply.status(200).send(resource);
		}
		return reply.status(404).send({
			statusCode: 404,
			message: `The Resource with key '${orderNumber}' was not found.`,
			errors: [
				{
					code: "ResourceNotFound",
					message: `The Resource with key '${orderNumber}' was not found.`,
				},
			],
		});
	}

	search(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
		const resource = this.repository.search(
			getRepositoryContext(request),
			request.body,
		);
		return reply.status(200).send(resource);
	}
}
