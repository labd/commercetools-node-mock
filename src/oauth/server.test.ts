import express from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { getBaseResourceProperties } from "../helpers";
import { hashPassword } from "../lib/password";
import { CustomerRepository } from "../repositories/customer";
import type { AbstractStorage } from "../storage";
import { InMemoryStorage } from "../storage";
import { OAuth2Server } from "./server";

describe("OAuth2Server", () => {
	let app: express.Express;
	let server: OAuth2Server;

	let storage: AbstractStorage;
	let customerRepository: CustomerRepository;

	beforeEach(() => {
		server = new OAuth2Server({ enabled: true, validate: false });
		app = express();
		app.use(server.createRouter());

		storage = new InMemoryStorage();
		customerRepository = new CustomerRepository(storage);
		server.setCustomerRepository(customerRepository);
	});

	describe("POST /token", () => {
		it("should return a token for valid client credentials", async () => {
			const response = await supertest(app)
				.post("/token")
				.auth("validClientId", "validClientSecret")
				.query({ grant_type: "client_credentials" })
				.send();

			const body = await response.body;

			expect(response.status, JSON.stringify(body)).toBe(200);
			expect(body).toHaveProperty("access_token");
		});

		it("should failed on invalid refresh token", async () => {
			const response = await supertest(app)
				.post("/token")
				.auth("validClientId", "validClientSecret")
				.query({ grant_type: "refresh_token", refresh_token: "invalid" })
				.send();

			const body = await response.body;

			expect(response.status, JSON.stringify(body)).toBe(400);
		});

		it("should refresh a token", async () => {
			const createResponse = await supertest(app)
				.post(`/my-project/anonymous/token`)
				.auth("validClientId", "validClientSecret")
				.query({ grant_type: "client_credentials" })
				.send();

			const refreshToken = createResponse.body.refresh_token;

			const response = await supertest(app)
				.post("/token")
				.auth("validClientId", "validClientSecret")
				.query({ grant_type: "refresh_token", refresh_token: refreshToken })
				.send();

			const body = await response.body;

			expect(response.status, JSON.stringify(body)).toBe(200);
			expect(body.access_token).not.toBe(createResponse.body.access_token);
			expect(body.refresh_token).toBeUndefined();
		});
	});

	describe("POST /:projectKey/anonymous/token", () => {
		it("should return a token for anonymous access", async () => {
			const projectKey = "test-project";

			const response = await supertest(app)
				.post(`/${projectKey}/anonymous/token`)
				.auth("validClientId", "validClientSecret")
				.query({ grant_type: "client_credentials" })
				.send();

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("access_token");
			expect(response.body).toEqual({
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

			const response = await supertest(app)
				.post(`/${projectKey}/customers/token`)
				.auth("validClientId", "validClientSecret")
				.query({
					grant_type: "password",
					username: "j.doe@example.org",
					password: "password",
					scope: `${projectKey}:manage_my_profile`,
				})
				.send();

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
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

			const response = await supertest(app)
				.post(`/${projectKey}/in-store/key=${storeKey}/customers/token`)
				.auth("validClientId", "validClientSecret")
				.query({
					grant_type: "password",
					username: "j.doe@example.org",
					password: "password",
					scope: `${projectKey}:manage_my_profile`,
				})
				.send();

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				scope: expect.stringMatching(/customer_id:([^\s]+)/),
				access_token: expect.stringMatching(/\S{8,}==$/),
				refresh_token: expect.stringMatching(/test-project:\S{8,}==$/),
				expires_in: 172800,
				token_type: "Bearer",
			});
		});
	});
});
