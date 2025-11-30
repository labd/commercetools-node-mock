import type { Router } from "express";
import type { PaymentRepository } from "../repositories/payment/index.ts";
import AbstractService from "./abstract.ts";

export class MyPaymentService extends AbstractService {
	public repository: PaymentRepository;

	constructor(parent: Router, repository: PaymentRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me/payments";
	}
}
