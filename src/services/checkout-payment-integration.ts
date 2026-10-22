import type { FastifyInstance } from "fastify";
import type { CheckoutPaymentIntegrationRepository } from "../repositories/checkout-payment-integration/index.ts";
import AbstractService from "./abstract.ts";

/** Served on the Checkout API's host. */
export class CheckoutPaymentIntegrationService extends AbstractService {
	public repository: CheckoutPaymentIntegrationRepository;

	constructor(
		parent: FastifyInstance,
		repository: CheckoutPaymentIntegrationRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "payment-integrations";
	}
}
