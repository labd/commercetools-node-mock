import type { Request, Response, Router } from "express";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { OrderRepository } from "../repositories/order/index.ts";
import AbstractService from "./abstract.ts";

export class OrderService extends AbstractService {
	public repository: OrderRepository;

	constructor(parent: Router, repository: OrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "orders";
	}

	extraRoutes(router: Router) {
		router.post("/import", this.import.bind(this));
		router.get(
			"/order-number=:orderNumber",
			this.getWithOrderNumber.bind(this),
		);
	}

	import(request: Request, response: Response) {
		const importDraft = request.body;
		const resource = this.repository.import(
			getRepositoryContext(request),
			importDraft,
		);
		response.status(200).send(resource);
	}

	getWithOrderNumber(request: Request, response: Response) {
		const orderNumber = request.params.orderNumber;
		const resource = this.repository.getWithOrderNumber(
			getRepositoryContext(request),
			orderNumber,

			// @ts-expect-error
			request.query,
		);
		if (resource) {
			response.status(200).send(resource);
			return;
		}
		response.status(404).send({
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
}
