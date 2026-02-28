import type { Update } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { updateRequestSchema } from "#src/schemas/update-request.ts";
import { validateData } from "#src/validate.ts";
import { hashPassword } from "../lib/password.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { MyCustomerRepository } from "../repositories/my-customer.ts";
import AbstractService from "./abstract.ts";

export class MyCustomerService extends AbstractService {
	public repository: MyCustomerRepository;

	constructor(parent: FastifyInstance, repository: MyCustomerRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me";
	}

	registerRoutes(parent: FastifyInstance) {
		// Overwrite this function to be able to handle /me path.
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("", this.getMe.bind(this));
				instance.post("", this.updateMe.bind(this));
				instance.delete("", this.deleteMe.bind(this));

				instance.post("/signup", this.signUp.bind(this));

				instance.post("/login", this.signIn.bind(this));
				instance.post("/password", this.changePassword.bind(this));
				instance.post("/password/reset", this.resetPassword.bind(this));
				instance.post("/email/confirm", this.emailConfirm.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}

	getMe(request: FastifyRequest, reply: FastifyReply) {
		const resource = this.repository.getMe(getRepositoryContext(request));
		if (!resource) {
			return reply.status(404).send({ statusCode: 404 });
		}
		return reply.status(200).send(resource);
	}

	updateMe(request: FastifyRequest, reply: FastifyReply) {
		const resource = this.repository.getMe(getRepositoryContext(request));

		if (!resource) {
			return reply.status(404).send({ statusCode: 404 });
		}
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);
		const updatedResource = this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = this._expandWithId(request, updatedResource.id);
		return reply.status(200).send(result);
	}

	deleteMe(request: FastifyRequest, reply: FastifyReply) {
		const resource = this.repository.deleteMe(getRepositoryContext(request));
		if (!resource) {
			return reply.status(404).send({ statusCode: 404 });
		}

		return reply.status(200).send(resource);
	}

	signUp(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
		const draft = request.body;
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft,
		);
		const result = this._expandWithId(request, resource.id);
		return reply.status(this.createStatusCode).send({ customer: result });
	}

	changePassword(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
		const customer = this.repository.changePassword(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	resetPassword(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
		const customer = this.repository.passwordReset(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	emailConfirm(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
		const customer = this.repository.confirmEmail(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	signIn(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
		const body = request.body;
		const { email, password } = body;
		const encodedPassword = hashPassword(password);

		const result = this.repository.query(getRepositoryContext(request), {
			where: [`email = "${email}"`, `password = "${encodedPassword}"`],
		});

		if (result.count === 0) {
			return reply.status(400).send({
				message: "Account with the given credentials not found.",
				errors: [
					{
						code: "InvalidCredentials",
						message: "Account with the given credentials not found.",
					},
				],
			});
		}

		return reply.status(200).send({ customer: result.results[0] });
	}
}
