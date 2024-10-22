import type { Request, Response, Router } from "express";
import { getRepositoryContext } from "~src/repositories/helpers";
import type { ProductRepository } from "../repositories/product";
import AbstractService from "./abstract";

export class ProductService extends AbstractService {
	public repository: ProductRepository;

	constructor(parent: Router, repository: ProductRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "products";
	}

	extraRoutes(router: Router) {
		router.post("/search", this.search.bind(this));
	}

	search(request: Request, response: Response) {
		const searchBody = request.body;
		const resource = this.repository.search(
			getRepositoryContext(request),
			searchBody,
		);
		return response.status(200).send(resource);
	}
}
