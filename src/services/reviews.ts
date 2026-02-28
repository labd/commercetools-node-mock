import type { FastifyInstance } from "fastify";
import type { ReviewRepository } from "../repositories/review.ts";
import AbstractService from "./abstract.ts";

export class ReviewService extends AbstractService {
	public repository: ReviewRepository;

	constructor(parent: FastifyInstance, repository: ReviewRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "reviews";
	}
}
