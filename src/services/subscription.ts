import type { Router } from "express";
import type { SubscriptionRepository } from "../repositories/subscription";
import AbstractService from "./abstract";

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
