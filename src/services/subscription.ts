import type { Router } from "express";
import type { SubscriptionRepository } from "../repositories/subscription.ts";
import AbstractService from "./abstract.ts";

export class SubscriptionService extends AbstractService {
	public repository: SubscriptionRepository;

	constructor(parent: Router, repository: SubscriptionRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "subscriptions";
	}
}
