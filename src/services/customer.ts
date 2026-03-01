import type {
	CustomerCreateEmailToken,
	CustomerCreatePasswordResetToken,
	CustomerDraft,
	CustomerEmailVerify,
	CustomerResetPassword,
	CustomerSignInResult,
} from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { validateDraft } from "#src/validate.ts";
import type { CustomerRepository } from "../repositories/customer/index.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import AbstractService from "./abstract.ts";

export class CustomerService extends AbstractService {
	public repository: CustomerRepository;

	constructor(parent: FastifyInstance, repository: CustomerRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "customers";
	}

	extraRoutes(parent: FastifyInstance) {
		parent.post("/password-token", this.passwordResetToken.bind(this));
		parent.post("/password/reset", this.passwordReset.bind(this));
		parent.post("/email-token", this.emailToken.bind(this));
		parent.post("/email/confirm", this.emailTokenConfirm.bind(this));
	}

	post(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Querystring: Record<string, any>;
			Body: CustomerDraft;
		}>,
		reply: FastifyReply,
	) {
		// Validate the draft against the schema when strict mode is enabled
		if (this.repository.strict && this.repository.draftSchema) {
			validateDraft(request.body, this.repository.draftSchema);
		}

		const resource = this.repository.create(
			getRepositoryContext(request),
			request.body,
		);
		const expanded = this._expandWithId(request, resource.id);

		const result: CustomerSignInResult = {
			customer: expanded,
		};
		return reply.status(this.createStatusCode).send(result);
	}

	passwordResetToken(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: CustomerCreatePasswordResetToken;
		}>,
		reply: FastifyReply,
	) {
		const customer = this.repository.passwordResetToken(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	passwordReset(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: CustomerResetPassword;
		}>,
		reply: FastifyReply,
	) {
		const customer = this.repository.passwordReset(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}

	emailToken(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: CustomerCreateEmailToken;
		}>,
		reply: FastifyReply,
	) {
		const body = request.body;
		const id = body.id;
		const token = this.repository.emailToken(getRepositoryContext(request), id);
		return reply.status(200).send(token);
	}

	emailTokenConfirm(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: CustomerEmailVerify;
		}>,
		reply: FastifyReply,
	) {
		const customer = this.repository.emailTokenConfirm(
			getRepositoryContext(request),
			request.body,
		);

		return reply.status(200).send(customer);
	}
}
