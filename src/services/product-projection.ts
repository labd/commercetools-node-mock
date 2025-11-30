import type { Request, Response, Router } from "express";
import { queryParamsArray, queryParamsValue } from "../helpers.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type {
	ProductProjectionQueryParams,
	ProductProjectionRepository,
} from "./../repositories/product-projection.ts";
import AbstractService from "./abstract.ts";

export class ProductProjectionService extends AbstractService {
	public repository: ProductProjectionRepository;

	constructor(parent: Router, repository: ProductProjectionRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "product-projections";
	}

	extraRoutes(router: Router) {
		router.get("/search", this.search.bind(this));
	}

	get(request: Request, response: Response) {
		const limit = this._parseParam(request.query.limit);
		const offset = this._parseParam(request.query.offset);

		const result = this.repository.query(getRepositoryContext(request), {
			...request.query,
			expand: this._parseParam(request.query.expand),
			where: this._parseParam(request.query.where),
			limit: limit !== undefined ? Number(limit) : undefined,
			offset: offset !== undefined ? Number(offset) : undefined,
		});
		response.status(200).send(result);
	}

	search(request: Request, response: Response) {
		const query = request.query;
		const searchParams: ProductProjectionQueryParams = {
			filter: queryParamsArray(query.filter),
			"filter.query": queryParamsArray(query["filter.query"]),
			facet: queryParamsArray(query.facet),
			expand: queryParamsArray(query.expand),
			staged: queryParamsValue(query.staged) === "true",
			localeProjection: queryParamsValue(query.localeProjection),
			storeProjection: queryParamsValue(query.storeProjection),
			priceChannel: queryParamsValue(query.priceChannel),
			priceCountry: queryParamsValue(query.priceCountry),
			priceCurrency: queryParamsValue(query.priceCurrency),
			priceCustomerGroup: queryParamsValue(query.priceCustomerGroup),
			offset: query.offset ? Number(queryParamsValue(query.offset)) : undefined,
			limit: query.limit ? Number(queryParamsValue(query.limit)) : undefined,
		};
		const resource = this.repository.search(
			getRepositoryContext(request),
			searchParams,
		);
		response.status(200).send(resource);
	}
}
