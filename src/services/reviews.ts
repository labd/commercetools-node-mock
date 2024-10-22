import type { Router } from "express";
import type { ReviewRepository } from "../repositories/review";
import AbstractService from "./abstract";

export class ReviewService extends AbstractService {
	public repository: ReviewRepository;

	constructor(parent: Router, repository: ReviewRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "reviews";
	}
}
