import type {
	OrderImportDraft,
	OrderSearchRequest,
	ResourceNotFoundError,
} from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
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

	async import(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: OrderImportDraft;
		}>,
		reply: FastifyReply,
	) {
		const importDraft = request.body;
		const resource = await this.repository.import(
			getRepositoryContext(request),
			importDraft,
		);
		return reply.status(200).send(resource);
	}

	async getWithOrderNumber(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const orderNumber = params.orderNumber;
		const resource = await this.repository.getWithOrderNumber(
			getRepositoryContext(request),
			orderNumber,

			// @ts-expect-error
			request.query,
		);
		if (resource) {
			return reply.status(200).send(resource);
		}
		throw new CommercetoolsError<ResourceNotFoundError>(
			{
				code: "ResourceNotFound",
				message: `The Resource with key '${orderNumber}' was not found.`,
			},
			404,
		);
	}

	async search(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: OrderSearchRequest;
		}>,
		reply: FastifyReply,
	) {
		const resource = await this.repository.search(
			getRepositoryContext(request),
			request.body,
		);
		return reply.status(200).send(resource);
	}
}
