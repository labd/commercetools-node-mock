import type { CustomerSignInResult } from "@commercetools/platform-sdk";
import type { Request, Response, Router } from "express";
import type { CustomerRepository } from "../repositories/customer/index.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import AbstractService from "./abstract.ts";

export class CustomerService extends AbstractService {
	public repository: CustomerRepository;

	constructor(parent: Router, repository: CustomerRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "customers";
	}

	extraRoutes(parent: Router) {
		parent.post("/password-token", this.passwordResetToken.bind(this));
		parent.post("/password/reset", this.passwordReset.bind(this));
		parent.post("/email-token", this.emailToken.bind(this));
		parent.post("/email/confirm", this.emailTokenConfirm.bind(this));
	}

	post(request: Request, response: Response) {
		const draft = request.body;
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft,
		);
		const expanded = this._expandWithId(request, resource.id);

		const result: CustomerSignInResult = {
			customer: expanded,
		};
		response.status(this.createStatusCode).send(result);
	}

	passwordResetToken(request: Request, response: Response) {
		const customer = this.repository.passwordResetToken(
			getRepositoryContext(request),
			request.body,
		);

		response.status(200).send(customer);
	}

	passwordReset(request: Request, response: Response) {
		const customer = this.repository.passwordReset(
			getRepositoryContext(request),
			request.body,
		);

		response.status(200).send(customer);
	}

	emailToken(request: Request, response: Response) {
		const id = request.body.id;
		const token = this.repository.emailToken(
			getRepositoryContext(request),
			id,
		);
		response.status(200).send(token);
	}

	emailTokenConfirm(request: Request, response: Response) {
		const customer = this.repository.emailTokenConfirm(
			getRepositoryContext(request),
			request.body,
		);

		response.status(200).send(customer);
	}
}
