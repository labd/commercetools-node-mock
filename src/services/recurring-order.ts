import type { Router } from "express";
import type { RecurringOrderRepository } from "../repositories/recurring-order/index.ts";
import AbstractService from "./abstract.ts";

export class RecurringOrderService extends AbstractService {
	public repository: RecurringOrderRepository;

	constructor(parent: Router, repository: RecurringOrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "recurring-orders";
	}
}
