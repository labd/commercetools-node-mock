import path from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import type {
	CustomObject,
	InvalidInputError,
	Project,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import { cloneObject } from "../helpers.ts";
import { parseQueryExpression } from "../lib/predicateParser.ts";
import type {
	PagedQueryResponseMap,
	ResourceMap,
	ResourceType,
} from "../types.ts";
import type { GetParams, QueryParams } from "./abstract.ts";
import { AbstractStorage } from "./abstract.ts";

export type SQLiteStorageOptions = {
	/**
	 * Path to the SQLite database file.
	 * Defaults to `commercetools-mock.db` in the current working directory.
	 * Use `':memory:'` for an in-memory database.
	 */
	filename?: string;
};

const DEFAULT_PROJECT: Omit<Project, "key"> = {
	name: "",
	countries: [],
	currencies: [],
	languages: [],
	createdAt: "2018-10-04T11:32:12.603Z",
	trialUntil: "2018-12",
	carts: {
		countryTaxRateFallbackEnabled: false,
		deleteDaysAfterLastModification: 90,
		priceRoundingMode: "HalfEven",
		taxRoundingMode: "HalfEven",
	},
	shoppingLists: {
		deleteDaysAfterLastModification: 360,
	},
	messages: { enabled: false, deleteDaysAfterCreation: 15 },
	shippingRateInputType: undefined,
	externalOAuth: undefined,
	searchIndexing: {
		products: {
			status: "Deactivated",
		},
		productsSearch: {
			status: "Deactivated",
		},
		orders: {
			status: "Deactivated",
		},
		customers: {
			status: "Deactivated",
		},
		businessUnits: {
			status: "Deactivated",
		},
	},
	discounts: {
		discountCombinationMode: "Stacking",
	},
	version: 1,
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    project_key TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resources (
    project_key TEXT NOT NULL,
    type_id TEXT NOT NULL,
    id TEXT NOT NULL,
    key TEXT,
    container TEXT,
    co_key TEXT,
    data TEXT NOT NULL,
    PRIMARY KEY (project_key, type_id, id)
  );

  CREATE INDEX IF NOT EXISTS idx_resources_key
    ON resources (project_key, type_id, key) WHERE key IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_resources_container_key
    ON resources (project_key, container, co_key)
    WHERE type_id = 'key-value-document';
`;

export class SQLiteStorage extends AbstractStorage {
	private db: DatabaseSync;

	// Cache of known project keys to avoid redundant INSERT+SELECT on every add()
	private _knownProjects: Set<string> = new Set();

	// Prepared statements (lazily created)
	private _stmtInsertProject: StatementSync | null = null;
	private _stmtGetProject: StatementSync | null = null;
	private _stmtUpsertProject: StatementSync | null = null;
	private _stmtInsertResource: StatementSync | null = null;
	private _stmtGetResource: StatementSync | null = null;
	private _stmtGetResourceByKey: StatementSync | null = null;
	private _stmtAllResources: StatementSync | null = null;
	private _stmtDeleteResource: StatementSync | null = null;
	private _stmtClearResources: StatementSync | null = null;
	private _stmtGetResourceByContainerAndKey: StatementSync | null = null;
	private _stmtCountResources: StatementSync | null = null;

	constructor(options: SQLiteStorageOptions = {}) {
		super();

		const filename =
			options.filename ?? path.join(process.cwd(), "commercetools-mock.db");

		this.db = new DatabaseSync(filename);
		this.db.exec(SCHEMA);

		// Migration: add container and co_key columns for existing databases
		this._migrateSchema();
	}

	/**
	 * Add columns that may not exist in databases created before this version.
	 * ALTER TABLE ADD COLUMN is a no-op if the column already exists in SQLite
	 * when using IF NOT EXISTS (not supported), so we catch errors instead.
	 */
	private _migrateSchema(): void {
		const columns = this.db
			.prepare("PRAGMA table_info(resources)")
			.all() as Array<{ name: string }>;
		const columnNames = new Set(columns.map((c) => c.name));

		if (!columnNames.has("container")) {
			this.db.exec("ALTER TABLE resources ADD COLUMN container TEXT");
		}
		if (!columnNames.has("co_key")) {
			this.db.exec("ALTER TABLE resources ADD COLUMN co_key TEXT");
		}
	}

	/**
	 * Close the database connection. Call this when you're done using the storage.
	 */
	override close(): void {
		if (this.db.isOpen) {
			this.db.close();
		}
	}

	private get stmtInsertProject() {
		if (!this._stmtInsertProject) {
			this._stmtInsertProject = this.db.prepare(
				"INSERT OR IGNORE INTO projects (project_key, data) VALUES (?, ?)",
			);
		}
		return this._stmtInsertProject;
	}

	private get stmtGetProject() {
		if (!this._stmtGetProject) {
			this._stmtGetProject = this.db.prepare(
				"SELECT data FROM projects WHERE project_key = ?",
			);
		}
		return this._stmtGetProject;
	}

	private get stmtUpsertProject() {
		if (!this._stmtUpsertProject) {
			this._stmtUpsertProject = this.db.prepare(
				"INSERT OR REPLACE INTO projects (project_key, data) VALUES (?, ?)",
			);
		}
		return this._stmtUpsertProject;
	}

	private get stmtInsertResource() {
		if (!this._stmtInsertResource) {
			this._stmtInsertResource = this.db.prepare(
				"INSERT OR REPLACE INTO resources (project_key, type_id, id, key, container, co_key, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
			);
		}
		return this._stmtInsertResource;
	}

	private get stmtGetResource() {
		if (!this._stmtGetResource) {
			this._stmtGetResource = this.db.prepare(
				"SELECT data FROM resources WHERE project_key = ? AND type_id = ? AND id = ?",
			);
		}
		return this._stmtGetResource;
	}

	private get stmtGetResourceByKey() {
		if (!this._stmtGetResourceByKey) {
			this._stmtGetResourceByKey = this.db.prepare(
				"SELECT data FROM resources WHERE project_key = ? AND type_id = ? AND key = ?",
			);
		}
		return this._stmtGetResourceByKey;
	}

	private get stmtAllResources() {
		if (!this._stmtAllResources) {
			this._stmtAllResources = this.db.prepare(
				"SELECT data FROM resources WHERE project_key = ? AND type_id = ?",
			);
		}
		return this._stmtAllResources;
	}

	private get stmtCountResources() {
		if (!this._stmtCountResources) {
			this._stmtCountResources = this.db.prepare(
				"SELECT COUNT(*) as cnt FROM resources WHERE project_key = ? AND type_id = ?",
			);
		}
		return this._stmtCountResources;
	}

	private get stmtDeleteResource() {
		if (!this._stmtDeleteResource) {
			this._stmtDeleteResource = this.db.prepare(
				"DELETE FROM resources WHERE project_key = ? AND type_id = ? AND id = ?",
			);
		}
		return this._stmtDeleteResource;
	}

	private get stmtClearResources() {
		if (!this._stmtClearResources) {
			this._stmtClearResources = this.db.prepare("DELETE FROM resources");
		}
		return this._stmtClearResources;
	}

	private get stmtGetResourceByContainerAndKey() {
		if (!this._stmtGetResourceByContainerAndKey) {
			this._stmtGetResourceByContainerAndKey = this.db.prepare(
				`SELECT data FROM resources
				 WHERE project_key = ?
				   AND type_id = 'key-value-document'
				   AND container = ?
				   AND co_key = ?`,
			);
		}
		return this._stmtGetResourceByContainerAndKey;
	}

	private ensureProject(projectKey: string): void {
		if (this._knownProjects.has(projectKey)) {
			return;
		}
		const project: Project = { ...DEFAULT_PROJECT, key: projectKey };
		this.stmtInsertProject.run(projectKey, JSON.stringify(project));
		this._knownProjects.add(projectKey);
	}

	async addProject(projectKey: string): Promise<Project> {
		this.ensureProject(projectKey);

		const row = this.stmtGetProject.get(projectKey) as
			| { data: string }
			| undefined;
		if (!row) {
			throw new Error(`Failed to create project ${projectKey}`);
		}
		return JSON.parse(row.data) as Project;
	}

	async getProject(projectKey: string): Promise<Project> {
		return this.addProject(projectKey);
	}

	async saveProject(project: Project): Promise<Project> {
		this.stmtUpsertProject.run(project.key, JSON.stringify(project));
		return project;
	}

	async clear(): Promise<void> {
		this.stmtClearResources.run();
		this._knownProjects.clear();
	}

	async all<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
	): Promise<ResourceMap[RT][]> {
		const rows = this.stmtAllResources.all(projectKey, typeId) as Array<{
			data: string;
		}>;
		return rows.map((row) => JSON.parse(row.data) as ResourceMap[RT]);
	}

	async count(projectKey: string, typeId: ResourceType): Promise<number> {
		const row = this.stmtCountResources.get(projectKey, typeId) as {
			cnt: number;
		};
		return row.cnt;
	}

	async add<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		obj: ResourceMap[RT],
		params: GetParams = {},
	): Promise<ResourceMap[RT]> {
		// Ensure the project exists (cached, no DB round-trip after first call)
		this.ensureProject(projectKey);

		const key = (obj as any).key ?? null;

		// Extract container and key for custom objects to enable indexed lookups
		const container =
			typeId === "key-value-document" ? ((obj as any).container ?? null) : null;
		const coKey =
			typeId === "key-value-document" ? ((obj as any).key ?? null) : null;

		this.stmtInsertResource.run(
			projectKey,
			typeId,
			obj.id,
			key,
			container,
			coKey,
			JSON.stringify(obj),
		);

		// Return a clone instead of the caller's reference so that expand()
		// can safely mutate it without affecting the caller's object.
		const clone = cloneObject(obj);
		return this.expand(projectKey, clone, params.expand);
	}

	async get<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams = {},
	): Promise<ResourceMap[RT] | null> {
		const row = this.stmtGetResource.get(projectKey, typeId, id) as
			| { data: string }
			| undefined;
		if (row) {
			const resource = JSON.parse(row.data) as ResourceMap[RT];
			return this.expand(projectKey, resource, params.expand);
		}
		return null;
	}

	async getByKey<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		key: string,
		params: GetParams = {},
	): Promise<ResourceMap[RT] | null> {
		const row = this.stmtGetResourceByKey.get(projectKey, typeId, key) as
			| { data: string }
			| undefined;
		if (row) {
			const resource = JSON.parse(row.data) as ResourceMap[RT];
			return this.expand(projectKey, resource, params.expand);
		}
		return null;
	}

	async delete<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams = {},
	): Promise<ResourceMap[RT] | null> {
		const resource = await this.get(projectKey, typeId, id);
		if (resource) {
			this.stmtDeleteResource.run(projectKey, typeId, id);
			return this.expand(projectKey, resource, params.expand);
		}
		return null;
	}

	async getByContainerAndKey(
		projectKey: string,
		container: string,
		key: string,
	): Promise<CustomObject | null> {
		const row = this.stmtGetResourceByContainerAndKey.get(
			projectKey,
			container,
			key,
		) as { data: string } | undefined;
		if (row) {
			return JSON.parse(row.data) as CustomObject;
		}
		return null;
	}

	async query<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		params: QueryParams,
	): Promise<PagedQueryResponseMap[RT]> {
		let resources = await this.all<RT>(projectKey, typeId);

		// Apply predicates
		if (params.where) {
			const vars = Object.fromEntries(
				Object.entries(params)
					.filter(([key]) => key.startsWith("var."))
					.map(([key, value]) => [key.slice(4), value]),
			);

			try {
				const filterFunc = parseQueryExpression(params.where);
				resources = resources.filter((resource) => filterFunc(resource, vars));
			} catch (err) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: "InvalidInput",
						message: (err as any).message,
					},
					400,
				);
			}
		}

		// Get the total before slicing the array
		const totalResources = resources.length;

		// Apply offset, limit
		const offset = params.offset || 0;
		const limit = params.limit || 20;
		resources = resources.slice(offset, offset + limit);

		// Expand the resources
		if (params.expand !== undefined) {
			resources = await Promise.all(
				resources.map((resource) =>
					this.expand(projectKey, resource, params.expand),
				),
			);
		}

		return {
			count: resources.length,
			total: totalResources,
			offset: offset,
			limit: limit,
			results: resources,
		} as PagedQueryResponseMap[RT];
	}
}
