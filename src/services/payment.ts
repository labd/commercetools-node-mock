import type { Router } from "express";
import type { PaymentRepository } from "../repositories/payment/index.ts";
import AbstractService from "./abstract.ts";

export class PaymentService extends AbstractService {
	public repository: PaymentRepository;

	constructor(parent: Router, repository: PaymentRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "payments";
	}
}
