import type {
	MyCustomerChangePassword,
	MyCustomerDraft,
	MyCustomerEmailVerify,
	MyCustomerResetPassword,
	MyCustomerSignin,
	ResourceNotFoundError,
	Update,
} from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
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

	async getMe(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const resource = await this.repository.getMe(getRepositoryContext(request));
		if (!resource) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "The Resource was not found.",
				},
				404,
			);
		}
		return reply.status(200).send(resource);
	}

	async updateMe(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
		}>,
		reply: FastifyReply,
	) {
		const resource = await this.repository.getMe(getRepositoryContext(request));

		if (!resource) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "The Resource was not found.",
				},
				404,
			);
		}
		const updateRequest = validateData<Update>(
			request.body,
			updateRequestSchema,
		);
		const updatedResource = await this.repository.processUpdateActions(
			getRepositoryContext(request),
			resource,
			updateRequest.version,
			updateRequest.actions,
		);

		const result = await this._expandWithId(request, updatedResource.id);
		return reply.status(200).send(result);
	}

	async deleteMe(
		request: FastifyRequest<{ Params: Record<string, string> }>,
		reply: FastifyReply,
	) {
		const resource = await this.repository.deleteMe(
			getRepositoryContext(request),
		);
		if (!resource) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "The Resource was not found.",
				},
				404,
			);
		}

		return reply.status(200).send(resource);
	}

	async signUp(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
			Body: MyCustomerDraft;
		}>,
		reply: FastifyReply,
	) {
		const draft = request.body;
		const resource = await this.repository.create(
			getRepositoryContext(request),
			draft,
		);
		const result = await this._expandWithId(request, resource.id);
		return reply.status(this.createStatusCode).send({ customer: result });
	}

	async changePassword(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: MyCustomerChangePassword;
		}>,
		reply: FastifyReply,
	) {
		const customer = await this.repository.changePassword(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	async resetPassword(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: MyCustomerResetPassword;
		}>,
		reply: FastifyReply,
	) {
		const customer = await this.repository.passwordReset(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	async emailConfirm(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: MyCustomerEmailVerify;
		}>,
		reply: FastifyReply,
	) {
		const customer = await this.repository.confirmEmail(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	async signIn(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: MyCustomerSignin;
		}>,
		reply: FastifyReply,
	) {
		const body = request.body;
		const { email, password } = body;
		const encodedPassword = hashPassword(password);

		const result = await this.repository.query(getRepositoryContext(request), {
			where: [`email = "${email}"`, `password = "${encodedPassword}"`],
		});

		if (result.count === 0) {
			throw new CommercetoolsError<any>(
				{
					code: "InvalidCredentials",
					message: "Account with the given credentials not found.",
				},
				400,
			);
		}

		return reply.status(200).send({ customer: result.results[0] });
	}
}
