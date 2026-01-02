import type {
	OrderPagedSearchResponse,
	OrderSearchRequest,
} from "@commercetools/platform-sdk";
import type { Hit } from "@commercetools/platform-sdk/dist/declarations/src/generated/models/order";
import type { Config } from "#src/config.ts";
import type { AbstractStorage } from "#src/storage/index.ts";

export class OrderSearch {
	protected _storage: AbstractStorage;

	constructor(config: Config) {
		this._storage = config.storage;
	}

	search(
		projectKey: string,
		params: OrderSearchRequest,
	): OrderPagedSearchResponse {
		const orderResources = this._storage.all(projectKey, "order");

		// TODO: implement filtering based on params.query
		const offset = params.offset || 0;
		const limit = params.limit || 20;
		const orderResult = orderResources.slice(offset, offset + limit);

		// Transform orders into Hit objects for the OrderSearchResult
		const results: Hit[] = orderResult.map((order) => ({
			id: order.id,
			version: order.version,
		}));

		return {
			total: orderResources.length,
			offset: offset,
			limit: limit,
			hits: results,
		};
	}
}
