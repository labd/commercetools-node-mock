import type { InvalidTokenError } from "@commercetools/platform-sdk";
import auth from "basic-auth";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AuthError, InvalidRequestError } from "#src/exceptions.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { hashPassword } from "../lib/password.ts";
import type { CustomerRepository } from "../repositories/customer/index.ts";
import type { InvalidClientError, UnsupportedGrantType } from "./errors.ts";
import { getBearerToken } from "./helpers.ts";
import { OAuth2Store } from "./store.ts";

declare module "fastify" {
	interface FastifyRequest {
		credentials?: {
			clientId: string;
			clientSecret: string;
		};
	}
}

export type Token = {
	access_token: string;
	token_type: "Bearer";
	expires_in: number;
	scope: string;
	refresh_token?: string;
};

export class OAuth2Server {
	store: OAuth2Store;

	private customerRepository: CustomerRepository;

	constructor(private options: { enabled: boolean; validate: boolean }) {
		this.store = new OAuth2Store(options.validate);
	}

	setCustomerRepository(repository: CustomerRepository) {
		this.customerRepository = repository;
	}

	createPlugin() {
		return async (instance: FastifyInstance) => {
			await instance.register(import("@fastify/formbody"));
			instance.decorateRequest("credentials", undefined);
			instance.addHook("preHandler", this.validateClientCredentials.bind(this));
			instance.post("/token", this.tokenHandler.bind(this));
			instance.post(
				"/:projectKey/customers/token",
				this.customerTokenHandler.bind(this),
			);
			instance.post(
				"/:projectKey/in-store/key=:storeKey/customers/token",
				this.inStoreCustomerTokenHandler.bind(this),
			);
			instance.post(
				"/:projectKey/anonymous/token",
				this.anonymousTokenHandler.bind(this),
			);
		};
	}

	createMiddleware() {
		if (!this.options.validate) {
			return async (request: FastifyRequest, reply: FastifyReply) => {
				// No-op when validation is disabled
			};
		}

		return async (request: FastifyRequest, reply: FastifyReply) => {
			const token = getBearerToken(request);
			if (!token) {
				throw new CommercetoolsError<InvalidTokenError>(
					{
						code: "invalid_token",
						message:
							"This endpoint requires an access token. You can get one from the authorization server.",
					},
					401,
				);
			}

			if (!token || !this.store.validateToken(token)) {
				throw new CommercetoolsError<InvalidTokenError>(
					{
						code: "invalid_token",
						message: "invalid_token",
					},
					401,
				);
			}
		};
	}

	async validateClientCredentials(
		request: FastifyRequest,
		reply: FastifyReply,
	) {
		const authHeader = request.headers.authorization;
		if (!authHeader) {
			throw new CommercetoolsError<InvalidClientError>(
				{
					code: "invalid_client",
					message:
						"Please provide valid client credentials using HTTP Basic Authentication.",
				},
				401,
			);
		}
		const credentials = auth.parse(authHeader);
		if (!credentials) {
			throw new CommercetoolsError<InvalidClientError>(
				{
					code: "invalid_client",
					message:
						"Please provide valid client credentials using HTTP Basic Authentication.",
				},
				400,
			);
		}

		request.credentials = {
			clientId: credentials.name,
			clientSecret: credentials.pass,
		};
	}

	async tokenHandler(
		request: FastifyRequest<{
			Querystring: Record<string, any>;
			Body: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		if (!request.credentials) {
			throw new CommercetoolsError<InvalidClientError>(
				{
					code: "invalid_client",
					message: "Client credentials are missing.",
				},
				401,
			);
		}

		const query = request.query;
		const body = request.body;
		const grantType = query.grant_type || body?.grant_type;
		if (!grantType) {
			throw new CommercetoolsError<InvalidRequestError>(
				{
					code: "invalid_request",
					message: "Missing required parameter: grant_type.",
				},
				400,
			);
		}

		if (grantType === "client_credentials") {
			const token = this.store.getClientToken(
				request.credentials.clientId,
				request.credentials.clientSecret,
				query.scope?.toString(),
			);
			return reply.status(200).send(token);
		}
		if (grantType === "refresh_token") {
			const refreshToken =
				query.refresh_token?.toString() || body?.refresh_token;
			if (!refreshToken) {
				throw new CommercetoolsError<InvalidRequestError>(
					{
						code: "invalid_request",
						message: "Missing required parameter: refresh_token.",
					},
					400,
				);
			}
			const token = this.store.refreshToken(
				request.credentials.clientId,
				request.credentials.clientSecret,
				refreshToken,
			);
			if (!token) {
				throw new CommercetoolsError<AuthError>(
					{
						statusCode: 400,
						message: "The refresh token was not found. It may have expired.",
						error: "invalid_grant",
						error_description:
							"The refresh token was not found. It may have expired.",
					},
					400,
				);
			}
			return reply.status(200).send(token);
		}
		throw new CommercetoolsError<UnsupportedGrantType>(
			{
				code: "unsupported_grant_type",
				message: `Invalid parameter: grant_type: Invalid grant type: ${grantType}`,
			},
			400,
		);
	}

	async customerTokenHandler(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
			Body: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const body = request.body;
		const projectKey = params.projectKey;
		const grantType = query.grant_type || body?.grant_type;
		if (!grantType) {
			throw new CommercetoolsError<InvalidRequestError>(
				{
					code: "invalid_request",
					message: "Missing required parameter: grant_type.",
				},
				400,
			);
		}

		if (grantType === "password") {
			const username = query.username || body?.username;
			const password = hashPassword(query.password || body.password);
			const scope = query.scope?.toString() || body?.scope?.toString();

			const result = this.customerRepository.query(
				{ projectKey: params.projectKey },
				{
					where: [`email = "${username}"`, `password = "${password}"`],
				},
			);

			if (result.count === 0) {
				throw new CommercetoolsError<any>(
					{
						code: "invalid_customer_account_credentials",
						message: "Customer account with the given credentials not found.",
					},
					400,
				);
			}

			const customer = result.results[0];
			const token = this.store.getCustomerToken(projectKey, customer.id, scope);
			return reply.status(200).send(token);
		}
	}

	async inStoreCustomerTokenHandler(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
			Body: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const body = request.body;
		const projectKey = params.projectKey;
		const storeKey = params.storeKey;
		const grantType = query.grant_type || body.grant_type;
		if (!grantType) {
			throw new CommercetoolsError<InvalidRequestError>(
				{
					code: "invalid_request",
					message: "Missing required parameter: grant_type.",
				},
				400,
			);
		}

		if (grantType === "password") {
			const username = query.username || body.username;
			const password = hashPassword(query.password || body.password);
			const scope = query.scope?.toString() || body.scope?.toString();

			const result = this.customerRepository.query(
				{ projectKey, storeKey },
				{
					where: [`email = "${username}"`, `password = "${password}"`],
				},
			);

			if (result.count === 0) {
				throw new CommercetoolsError<any>(
					{
						code: "invalid_customer_account_credentials",
						message: "Customer account with the given credentials not found.",
					},
					400,
				);
			}

			const customer = result.results[0];
			const token = this.store.getCustomerToken(projectKey, customer.id, scope);
			return reply.status(200).send(token);
		}
	}

	async anonymousTokenHandler(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
			Body: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const params = request.params;
		const query = request.query;
		const body = request.body;
		const projectKey = params.projectKey;
		const grantType = query.grant_type || body.grant_type;
		if (!grantType) {
			throw new CommercetoolsError<InvalidRequestError>(
				{
					code: "invalid_request",
					message: "Missing required parameter: grant_type.",
				},
				400,
			);
		}

		if (grantType === "client_credentials") {
			const scope = query.scope?.toString() || body?.scope?.toString();

			const anonymous_id = undefined;

			const token = this.store.getAnonymousToken(
				projectKey,
				anonymous_id,
				scope,
			);
			return reply.status(200).send(token);
		}
	}
}
