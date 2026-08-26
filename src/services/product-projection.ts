import type { InvalidInputError } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
import { queryParamsArray, queryParamsValue } from "../helpers.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type {
	ProductProjectionQueryParams,
	ProductProjectionRepository,
} from "./../repositories/product-projection.ts";
import AbstractService from "./abstract.ts";

export class ProductProjectionService extends AbstractService {
	public repository: ProductProjectionRepository;

	constructor(
		parent: FastifyInstance,
		repository: ProductProjectionRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "product-projections";
	}

	extraRoutes(instance: FastifyInstance) {
		instance.get("/search", this.search.bind(this));
		instance.get("/suggest", this.suggest.bind(this));
	}

	async get(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const query = request.query;
		const limit = this._parseParam(query.limit);
		const offset = this._parseParam(query.offset);

		const result = await this.repository.query(getRepositoryContext(request), {
			...query,
			expand: this._parseParam(query.expand),
			where: this._parseParam(query.where),
			limit: limit !== undefined ? Number(limit) : undefined,
			offset: offset !== undefined ? Number(offset) : undefined,
		});
		return reply.status(200).send(result);
	}

	async suggest(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const query = request.query;
		const searchKeywords: Record<string, string> = {};
		for (const key in query) {
			if (key.startsWith("searchKeywords.")) {
				const value = queryParamsValue(query[key]);
				if (value !== undefined) {
					searchKeywords[key.substring("searchKeywords.".length)] = value;
				}
			}
		}

		if (Object.keys(searchKeywords).length === 0) {
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message:
						"Required parameter 'searchKeywords.{language}' is missing or invalid.",
				},
				400,
			);
		}

		const limit = queryParamsValue(query.limit);
		const fuzzyLevel = queryParamsValue(query.fuzzyLevel);
		const resource = await this.repository.suggest(
			getRepositoryContext(request),
			{
				searchKeywords,
				staged: queryParamsValue(query.staged) === "true",
				fuzzy: queryParamsValue(query.fuzzy) === "true",
				fuzzyLevel: fuzzyLevel !== undefined ? Number(fuzzyLevel) : undefined,
				limit: limit !== undefined ? Number(limit) : undefined,
			},
		);
		return reply.status(200).send(resource);
	}

	async search(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
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
		const resource = await this.repository.search(
			getRepositoryContext(request),
			searchParams,
		);
		return reply.status(200).send(resource);
	}
}
