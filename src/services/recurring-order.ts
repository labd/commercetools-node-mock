import type { Router } from "express";
import type { RecurringOrderRepository } from "../repositories/recurring-order/index";
import AbstractService from "./abstract";

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
