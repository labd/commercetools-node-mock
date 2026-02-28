import type { FastifyInstance } from "fastify";
import type { PaymentRepository } from "../repositories/payment/index.ts";
import AbstractService from "./abstract.ts";

export class PaymentService extends AbstractService {
	public repository: PaymentRepository;

	constructor(parent: FastifyInstance, repository: PaymentRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "payments";
	}
}
