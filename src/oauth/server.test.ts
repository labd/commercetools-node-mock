import Fastify, { type FastifyError, type FastifyReply, type FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it } from "vitest";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import { hashPassword } from "../lib/password.ts";
import { CustomerRepository } from "../repositories/customer/index.ts";
import type { AbstractStorage } from "../storage/index.ts";
import { InMemoryStorage } from "../storage/index.ts";
import { OAuth2Server } from "./server.ts";

describe("OAuth2Server", () => {
	let app: ReturnType<typeof Fastify>;
	let server: OAuth2Server;

	let storage: AbstractStorage;
	let customerRepository: CustomerRepository;

	beforeEach(async () => {
		server = new OAuth2Server({ enabled: true, validate: false });
		app = Fastify();
		app.register(server.createPlugin());
		app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
			if (error instanceof CommercetoolsError) {
				return reply.status(error.statusCode).send({
					statusCode: error.statusCode,
					message: error.message,
					errors: error.errors?.length > 0 ? error.errors : [error.info],
				});
			}
			return reply.status(500).send({ error: error.message });
		});

		storage = new InMemoryStorage();
		const config: Config = { storage, strict: false };
		customerRepository = new CustomerRepository(config);
		server.setCustomerRepository(customerRepository);

		await app.ready();
	});

	describe("POST /token", () => {
		it("should return a token for valid client credentials", async () => {
			const response = await app.inject({
				method: "POST",
				url: `/token?${new URLSearchParams({ grant_type: "client_credentials" })}`,
				headers: {
					Authorization: `Basic ${Buffer.from("validClientId:validClientSecret").toString("base64")}`,
				},
			});

			const body = response.json();

			expect(response.statusCode, JSON.stringify(body)).toBe(200);
			expect(body).toHaveProperty("access_token");
			expect(body).toEqual({
				// scope: expect.stringMatching(/anonymous_id:([^\s]+)/),
				scope: expect.any(String),
				access_token: expect.stringMatching(/\S{8,}==$/),
				refresh_token: expect.stringMatching(/my-project.*/),
				expires_in: 172800,
				token_type: "Bearer",
			});
		});

		it("should failed on invalid refresh token", async () => {
			const response = await app.inject({
				method: "POST",
				url: `/token?${new URLSearchParams({ grant_type: "refresh_token", refresh_token: "invalid" })}`,
				headers: {
					Authorization: `Basic ${Buffer.from("validClientId:validClientSecret").toString("base64")}`,
				},
			});

			const body = response.json();

			expect(response.statusCode, JSON.stringify(body)).toBe(400);
		});

		it("should refresh a token", async () => {
			const createResponse = await app.inject({
				method: "POST",
				url: `/my-project/anonymous/token?${new URLSearchParams({ grant_type: "client_credentials" })}`,
				headers: {
					Authorization: `Basic ${Buffer.from("validClientId:validClientSecret").toString("base64")}`,
				},
			});

			const refreshToken = createResponse.json().refresh_token;

			const response = await app.inject({
				method: "POST",
				url: `/token?${new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken })}`,
				headers: {
					Authorization: `Basic ${Buffer.from("validClientId:validClientSecret").toString("base64")}`,
				},
			});

			const body = response.json();

			expect(response.statusCode, JSON.stringify(body)).toBe(200);
			expect(body.access_token).not.toBe(createResponse.json().access_token);
			expect(body.refresh_token).toBeUndefined();
		});
	});

	describe("POST /:projectKey/anonymous/token", () => {
		it("should return a token for anonymous access", async () => {
			const projectKey = "test-project";

			const response = await app.inject({
				method: "POST",
				url: `/${projectKey}/anonymous/token?${new URLSearchParams({ grant_type: "client_credentials" })}`,
				headers: {
					Authorization: `Basic ${Buffer.from("validClientId:validClientSecret").toString("base64")}`,
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toHaveProperty("access_token");
			expect(response.json()).toEqual({
				scope: expect.stringMatching(/anonymous_id:([^\s]+)/),
				access_token: expect.stringMatching(/\S{8,}==$/),
				refresh_token: expect.stringMatching(/test-project:\S{8,}==$/),
				expires_in: 172800,
				token_type: "Bearer",
			});
		});
	});

	describe("POST /:projectKey/customers/token", () => {
		it("should return a token for customer access", async () => {
			const projectKey = "test-project";

			storage.add(projectKey, "customer", {
				...getBaseResourceProperties(),
				email: "j.doe@example.org",
				password: hashPassword("password"),
				addresses: [],
				authenticationMode: "password",
				isEmailVerified: true,
				stores: [],
			});

			const response = await app.inject({
				method: "POST",
				url: `/${projectKey}/customers/token?${new URLSearchParams({
					grant_type: "password",
					username: "j.doe@example.org",
					password: "password",
					scope: `${projectKey}:manage_my_profile`,
				})}`,
				headers: {
					Authorization: `Basic ${Buffer.from("validClientId:validClientSecret").toString("base64")}`,
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({
				scope: expect.stringMatching(/customer_id:([^\s]+)/),
				access_token: expect.stringMatching(/\S{8,}==$/),
				refresh_token: expect.stringMatching(/test-project:\S{8,}==$/),
				expires_in: 172800,
				token_type: "Bearer",
			});
		});
	});

	describe("POST /:projectKey/in-store/key=:storeKey/customers/token", () => {
		it("should return a token for in-store customer access", async () => {
			const projectKey = "test-project";
			const storeKey = "test-store";

			storage.add(projectKey, "customer", {
				...getBaseResourceProperties(),
				email: "j.doe@example.org",
				password: hashPassword("password"),
				addresses: [],
				authenticationMode: "password",
				isEmailVerified: true,
				stores: [
					{
						typeId: "store",
						key: storeKey,
					},
				],
			});

			const response = await app.inject({
				method: "POST",
				url: `/${projectKey}/in-store/key=${storeKey}/customers/token?${new URLSearchParams({
					grant_type: "password",
					username: "j.doe@example.org",
					password: "password",
					scope: `${projectKey}:manage_my_profile`,
				})}`,
				headers: {
					Authorization: `Basic ${Buffer.from("validClientId:validClientSecret").toString("base64")}`,
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({
				scope: expect.stringMatching(/customer_id:([^\s]+)/),
				access_token: expect.stringMatching(/\S{8,}==$/),
				refresh_token: expect.stringMatching(/test-project:\S{8,}==$/),
				expires_in: 172800,
				token_type: "Bearer",
			});
		});
	});
});
