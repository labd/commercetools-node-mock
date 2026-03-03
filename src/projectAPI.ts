import type { Config } from "./config.ts";
import { getBaseResourceProperties } from "./helpers.ts";
import type { GetParams } from "./repositories/abstract.ts";
import type { RepositoryMap } from "./repositories/index.ts";
import type { AbstractStorage } from "./storage/index.ts";
import type { ResourceMap, ResourceType } from "./types.ts";

export class ProjectAPI {
	private projectKey: string;

	private _storage: AbstractStorage;

	private _repositories: RepositoryMap;

	readonly config: Config;

	constructor(projectKey: string, repositories: RepositoryMap, config: Config) {
		this.projectKey = projectKey;
		this.config = config;
		this._storage = config.storage;
		this._repositories = repositories;
	}

	async unsafeAdd<T extends keyof RepositoryMap & keyof ResourceMap>(
		typeId: T,
		resource: ResourceMap[T],
	) {
		const repository = this._repositories[typeId];
		if (repository) {
			await this._storage.add(this.projectKey, typeId, {
				...getBaseResourceProperties(),
				...resource,
			});
		} else {
			throw new Error(`Service for ${typeId} not implemented yet`);
		}
	}

	async get<RT extends ResourceType>(
		typeId: RT,
		id: string,
		params?: GetParams,
	): Promise<ResourceMap[RT]> {
		const result = await this._storage.get(this.projectKey, typeId, id, params);
		return result as ResourceMap[RT];
	}

	// TODO: Not sure if we want to expose this...
	getRepository<RT extends keyof RepositoryMap>(typeId: RT): RepositoryMap[RT] {
		const repository = this._repositories[typeId];
		if (repository !== undefined) {
			return repository as RepositoryMap[RT];
		}
		throw new Error("No such repository");
	}
}
