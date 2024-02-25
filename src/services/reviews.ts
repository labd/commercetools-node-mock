import { Router } from "express";
import { ReviewRepository } from "../repositories/review";
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
