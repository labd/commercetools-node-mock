import type { FastifyInstance } from "fastify";
import type { CheckoutApplicationRepository } from "../repositories/checkout-application/index.ts";
import AbstractService from "./abstract.ts";

/** Served on the Checkout API's host. */
export class CheckoutApplicationService extends AbstractService {
	public repository: CheckoutApplicationRepository;

	constructor(
		parent: FastifyInstance,
		repository: CheckoutApplicationRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "applications";
	}
}
