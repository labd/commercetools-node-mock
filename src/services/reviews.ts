import { Router } from 'express'
import AbstractService from './abstract.js'
import { ReviewRepository } from '../repositories/review.js'

export class ReviewService extends AbstractService {
	public repository: ReviewRepository

	constructor(parent: Router, repository: ReviewRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'reviews'
	}
}
