import express, { NextFunction, Request, Response } from "express";
import inject from "light-my-request";
import morgan from "morgan";
import { http, HttpResponse } from "msw";
import { setupServer, SetupServer, SetupServerApi } from "msw/node";
import { DEFAULT_API_HOSTNAME, DEFAULT_AUTH_HOSTNAME } from "./constants";
import { CommercetoolsError } from "./exceptions";
import { copyHeaders } from "./lib/proxy";
import { OAuth2Server } from "./oauth/server";
import { ProjectAPI } from "./projectAPI";
import { AbstractStorage, InMemoryStorage } from "./storage";
import { Services } from "./types";

// Services
import { warnDeprecation } from "./deprecation";
import { mapHeaderType } from "./helpers";
import { createRepositories, RepositoryMap } from "./repositories";
import { ProjectRepository } from "./repositories/project";
import { createServices } from "./services";
import { ProjectService } from "./services/project";

export type CommercetoolsMockOptions = {
	validateCredentials: boolean;
	enableAuthentication: boolean;
	defaultProjectKey: string | undefined;
	apiHost: RegExp | string;
	authHost: RegExp | string;
	silent: boolean;
};

type AppOptions = { silent?: boolean };

const DEFAULT_OPTIONS: CommercetoolsMockOptions = {
	enableAuthentication: false,
	validateCredentials: false,
	defaultProjectKey: undefined,
	apiHost: DEFAULT_API_HOSTNAME,
	authHost: DEFAULT_AUTH_HOSTNAME,
	silent: false,
};

const _globalListeners: SetupServer[] = [];

export class CommercetoolsMock {
	public app: express.Express;

	public options: CommercetoolsMockOptions;

	private _storage: AbstractStorage;

	private _oauth2: OAuth2Server;

	private _mswServer: SetupServer | undefined = undefined;

	private _services: Services | null;

	private _repositories: RepositoryMap | null;

	private _projectService?: ProjectService;

	constructor(options: Partial<CommercetoolsMockOptions> = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
		this._services = null;
		this._repositories = null;
		this._projectService = undefined;

		this._storage = new InMemoryStorage();
		this._oauth2 = new OAuth2Server({
			enabled: this.options.enableAuthentication,
			validate: this.options.validateCredentials,
		});

		this.app = this.createApp({ silent: this.options.silent });
	}

	start() {
		warnDeprecation(
			"The start method is deprecated, use .registerHandlers() to bind to an msw server instead",
		);

		// Order is important here when the hostnames match
		this.clear();
		this.startServer();
	}

	stop() {
		warnDeprecation(
			"The stop method is deprecated, use .registerHandlers() to bind to an msw server instead",
		);
		this._mswServer?.close();
		this._mswServer = undefined;
	}

	clear() {
		this._storage.clear();
	}

	project(projectKey?: string) {
		if (!projectKey && !this.options.defaultProjectKey) {
			throw new Error("No projectKey passed and no default set");
		}

		if (this._repositories === null) {
			throw new Error("repositories not initialized yet");
		}

		return new ProjectAPI(
			projectKey || this.options.defaultProjectKey!,
			this._repositories,
			this._storage,
		);
	}

	authStore() {
		return this._oauth2.store;
	}

	runServer(port = 3000, options?: AppOptions) {
		const server = this.app.listen(port, () => {
			console.info(`Mock server listening at http://localhost:${port}`);
		});
		server.keepAliveTimeout = 60 * 1000;
	}

	private createApp(options?: AppOptions): express.Express {
		this._repositories = createRepositories(this._storage);
		this._oauth2.setCustomerRepository(this._repositories.customer);

		const app = express();

		const projectRouter = express.Router({ mergeParams: true });
		projectRouter.use(express.json());

		if (!options?.silent) {
			app.use(morgan("tiny"));
		}
		app.use("/oauth", this._oauth2.createRouter());

		// Only enable auth middleware if we have enabled this
		if (this.options.enableAuthentication) {
			app.use("/:projectKey", this._oauth2.createMiddleware(), projectRouter);
			app.use(
				"/:projectKey/in-store/key=:storeKey",
				this._oauth2.createMiddleware(),
				projectRouter,
			);
		} else {
			app.use("/:projectKey", projectRouter);
			app.use("/:projectKey/in-store/key=:storeKey", projectRouter);
		}

		// Register the rest api services in the router
		this._services = createServices(projectRouter, this._repositories);
		this._projectService = new ProjectService(
			projectRouter,
			this._repositories.project as ProjectRepository,
		);

		app.use((err: Error, req: Request, resp: Response, next: NextFunction) => {
			if (err instanceof CommercetoolsError) {
				if (err.errors?.length > 0) {
					return resp.status(err.statusCode).send({
						statusCode: err.statusCode,
						message: err.message,
						errors: err.errors,
					});
				}

				return resp.status(err.statusCode).send({
					statusCode: err.statusCode,
					message: err.message,
					errors: [err.info],
				});
			} else {
				console.error(err);
				return resp.status(500).send({
					error: err.message,
				});
			}
		});

		return app;
	}

	// registerHandlers is an alternative way to work with commercetools-mock, it
	// allows you to manage msw server yourself and register the handlers needed
	// for commercetools-mock to work.
	public registerHandlers(server: SetupServerApi) {
		const app = this.app;
		server.use(
			http.post(`${this.options.authHost}/oauth/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await inject(app)
					.post(url.pathname + "?" + url.searchParams.toString())
					.body(body)
					.headers(headers)
					.end();
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
			http.head(`${this.options.apiHost}/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await inject(app)
					.get(url.pathname + "?" + url.searchParams.toString())
					.body(body)
					.headers(headers)
					.end();

				if (res.statusCode === 200) {
					const parsedBody = JSON.parse(res.body);
					// Check if we have a count property (e.g. for query-lookups)
					// or if we have a result object (e.g. for single lookups)
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

				const res = await inject(app)
					.get(url.pathname + "?" + url.searchParams.toString())
					.body(body)
					.headers(headers)
					.end();
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
			http.post(`${this.options.apiHost}/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await inject(app)
					.post(url.pathname + "?" + url.searchParams.toString())
					.body(body)
					.headers(headers)
					.end();
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
			http.delete(`${this.options.apiHost}/*`, async ({ request }) => {
				const body = await request.text();
				const url = new URL(request.url);
				const headers = copyHeaders(request.headers);

				const res = await inject(app)
					.delete(url.pathname + "?" + url.searchParams.toString())
					.body(body)
					.headers(headers)
					.end();
				return new HttpResponse(res.body, {
					status: res.statusCode,
					headers: mapHeaderType(res.headers),
				});
			}),
		);
	}

	public mswServer() {
		return this._mswServer;
	}

	private startServer() {
		// Check if there are any other servers running
		if (_globalListeners.length > 0) {
			if (this._mswServer !== undefined) {
				throw new Error("Server already started");
			} else {
				console.warn("Server wasn't stopped properly, clearing");
				_globalListeners.forEach((listener) => listener.close());
			}
		}

		const server = setupServer();
		this.registerHandlers(server);
		server.listen({
			// We need to allow requests done by supertest
			onUnhandledRequest: (request, print) => {
				const url = new URL(request.url);
				if (url.hostname === "127.0.0.1") {
					return;
				}
				print.error();
			},
		});
		_globalListeners.push(server);
		this._mswServer = server;
	}
}
