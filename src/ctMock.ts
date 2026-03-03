import Fastify, { type FastifyInstance } from "fastify";
import { HttpResponse, http } from "msw";
import type { SetupServer, SetupServerApi } from "msw/node";
import qs from "qs";
import type { Config } from "./config.ts";
import { DEFAULT_API_HOSTNAME, DEFAULT_AUTH_HOSTNAME } from "./constants.ts";
import { CommercetoolsError } from "./exceptions.ts";
import { mapHeaderType } from "./helpers.ts";
import { copyHeaders } from "./lib/proxy.ts";
import { OAuth2Server } from "./oauth/server.ts";
import { ProjectAPI } from "./projectAPI.ts";
import type { RepositoryMap } from "./repositories/index.ts";
import { createRepositories } from "./repositories/index.ts";
import type { ProjectRepository } from "./repositories/project.ts";
import { createServices } from "./services/index.ts";
import { ProjectService } from "./services/project.ts";
import type { AbstractStorage } from "./storage/index.ts";
import { InMemoryStorage } from "./storage/index.ts";

export type CommercetoolsMockOptions = {
	validateCredentials: boolean;
	enableAuthentication: boolean;
	defaultProjectKey: string | undefined;
	apiHost: RegExp | string;
	authHost: RegExp | string;
	silent: boolean;
	strict: boolean;
	storage: AbstractStorage | undefined;
};

type AppOptions = { silent?: boolean };

const DEFAULT_OPTIONS: CommercetoolsMockOptions = {
	enableAuthentication: false,
	validateCredentials: false,
	defaultProjectKey: undefined,
	apiHost: DEFAULT_API_HOSTNAME,
	authHost: DEFAULT_AUTH_HOSTNAME,
	silent: true,
	strict: false,
	storage: undefined,
};

const _globalListeners: SetupServer[] = [];

export class CommercetoolsMock {
	public app: FastifyInstance;

	public options: CommercetoolsMockOptions;

	private _storage: AbstractStorage;

	private _oauth2: OAuth2Server;

	private _mswServer: SetupServer | undefined = undefined;

	private _repositories: RepositoryMap | null;

	// biome-ignore lint: lint/correctness/noUnusedPrivateClassMembers
	private _projectService: ProjectService | undefined;

	constructor(options: Partial<CommercetoolsMockOptions> = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
		this._repositories = null;
		this._projectService = undefined;

		this._storage = this.options.storage ?? new InMemoryStorage();
		this._oauth2 = new OAuth2Server({
			enabled: this.options.enableAuthentication,
			validate: this.options.validateCredentials,
		});

		this.app = this.createApp({ silent: this.options.silent });
	}

	get server() {
		return this.app.server;
	}

	async clear() {
		await this._storage.clear();
	}

	project(projectKey?: string) {
		if (!projectKey && !this.options.defaultProjectKey) {
			throw new Error("No projectKey passed and no default set");
		}

		if (this._repositories === null) {
			throw new Error("repositories not initialized yet");
		}

		const config: Config = {
			strict: this.options.strict,
			storage: this._storage,
		};

		return new ProjectAPI(
			projectKey || this.options.defaultProjectKey!,
			this._repositories,
			config,
		);
	}

	authStore() {
		return this._oauth2.store;
	}

	async runServer(port = 3000) {
		await this.app.listen({ port, host: "0.0.0.0" });
	}

	private createApp(options?: AppOptions): FastifyInstance {
		const config: Config = {
			strict: this.options.strict,
			storage: this._storage,
		};
		this._repositories = createRepositories(config);
		this._oauth2.setCustomerRepository(this._repositories.customer);

		const app = Fastify({
			// Set limit to 16mb, this is the maximum size allowed by the commercetools API: https://docs.commercetools.com/api/limits
			bodyLimit: 16 * 1024 * 1024,
			logger: !options?.silent ? { level: "info" } : false,
			routerOptions: {
				querystringParser: (str) => qs.parse(str),
			},
		});

		// Register OAuth routes
		app.register(this._oauth2.createPlugin(), { prefix: "/oauth" });

		// Register project routes
		const repositories = this._repositories;
		const oauth2 = this._oauth2;
		const enableAuth = this.options.enableAuthentication;

		const projectPlugin = async (instance: FastifyInstance) => {
			if (enableAuth) {
				instance.addHook("preHandler", oauth2.createMiddleware());
			}
			createServices(instance, repositories);
			new ProjectService(instance, repositories.project as ProjectRepository);
		};

		app.register(projectPlugin, { prefix: "/:projectKey" });
		app.register(projectPlugin, {
			prefix: "/:projectKey/in-store/key=:storeKey",
		});

		// Error handler
		app.setErrorHandler((error, request, reply) => {
			if (error instanceof CommercetoolsError) {
				const responseBody =
					error.errors?.length > 0
						? {
								statusCode: error.statusCode,
								message: error.message,
								errors: error.errors,
							}
						: {
								statusCode: error.statusCode,
								message: error.message,
								errors: [error.info],
							};

				if (!options?.silent) {
					// biome-ignore lint/suspicious/noConsole: intentional logging when silent is false
					console.error(
						`commercetools-mock: ${request.method} ${request.url} - ${error.statusCode}: ${error.message}`,
					);
				}

				return reply.status(error.statusCode).send(responseBody);
			}

			if (!options?.silent) {
				// biome-ignore lint/suspicious/noConsole: intentional logging when silent is false
				console.error(
					`commercetools-mock: ${request.method} ${request.url} - 500: ${error instanceof Error ? error.message : String(error)}`,
				);
			}

			return reply.status(500).send({
				error: error instanceof Error ? error.message : String(error),
			});
		});

		return app;
	}

	// registerHandlers is an alternative way to work with commercetools-mock, it
	// allows you to manage msw server yourself and register the handlers needed
	// for commercetools-mock to work.
	public registerHandlers(server: SetupServerApi) {
		const handlers = this.getHandlers();
		server.use(...handlers);
	}

	public getHandlers() {
		const app = this.app;
		return [
			http.post(`${this.options.authHost}/oauth/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await app.inject({
					method: "POST",
					url: `${url.pathname}?${url.searchParams.toString()}`,
					body,
					headers,
				});
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
			http.head(`${this.options.apiHost}/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await app.inject({
					method: "GET",
					url: `${url.pathname}?${url.searchParams.toString()}`,
					body,
					headers,
				});

				if (res.statusCode === 200) {
					const parsedBody = JSON.parse(res.body);
					const resultCount =
						"count" in parsedBody
							? parsedBody.count
							: Object.keys(parsedBody).length;

					return new HttpResponse(null, {
						status: resultCount > 0 ? 200 : 404,
						headers: mapHeaderType(res.headers),
					});
				}

				return new HttpResponse(null, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
			http.get(`${this.options.apiHost}/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await app.inject({
					method: "GET",
					url: `${url.pathname}?${url.searchParams.toString()}`,
					body,
					headers,
				});
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
			http.post(`${this.options.apiHost}/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await app.inject({
					method: "POST",
					url: `${url.pathname}?${url.searchParams.toString()}`,
					body,
					headers,
				});
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
			http.delete(`${this.options.apiHost}/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await app.inject({
					method: "DELETE",
					url: `${url.pathname}?${url.searchParams.toString()}`,
					body,
					headers,
				});
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
		];
	}

	public mswServer() {
		return this._mswServer;
	}
}
