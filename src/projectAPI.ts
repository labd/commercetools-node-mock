import { getBaseResourceProperties } from "./helpers";
import type { RepositoryMap } from "./repositories";
import type { GetParams } from "./repositories/abstract";
import type { AbstractStorage } from "./storage";
import type { ResourceMap, ResourceType } from "./types";

export class ProjectAPI {
	private projectKey: string;

	private _storage: AbstractStorage;

	private _repositories: RepositoryMap;

	constructor(
		projectKey: string,
		repositories: RepositoryMap,
		storage: AbstractStorage,
	) {
		this.projectKey = projectKey;
		this._storage = storage;
		this._repositories = repositories;
	}

	add<T extends keyof RepositoryMap & keyof ResourceMap>(
		typeId: T,
		resource: ResourceMap[T],
	) {
		process.emitWarning(
			"ctMock.add() is deprecated, create resources via regular create endpoints " +
				"or if you are really sure, use unsafeAdd() (but be aware of potential state issues)",
			"DeprecationWarning",
		);
		this.unsafeAdd(typeId, resource);
	}

	unsafeAdd<T extends keyof RepositoryMap & keyof ResourceMap>(
		typeId: T,
		resource: ResourceMap[T],
	) {
		const repository = this._repositories[typeId];
		if (repository) {
			this._storage.add(this.projectKey, typeId, {
				...getBaseResourceProperties(),
				...resource,
			});
		} else {
			throw new Error(`Service for ${typeId} not implemented yet`);
		}
	}

	get<RT extends ResourceType>(
		typeId: RT,
		id: string,
		params?: GetParams,
	): ResourceMap[RT] {
		return this._storage.get(
			this.projectKey,
			typeId,
			id,
			params,
		) as ResourceMap[RT];
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
