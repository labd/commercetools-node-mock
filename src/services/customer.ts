import type { CustomerSignInResult } from "@commercetools/platform-sdk";
import type { Router } from "express";
import type { Request, Response } from "express";
import type { CustomerRepository } from "../repositories/customer";
import { getRepositoryContext } from "../repositories/helpers";
import AbstractService from "./abstract";

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
		parent.post("/email-token", this.confirmEmailToken.bind(this));
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
		return response.status(this.createStatusCode).send(result);
	}

	passwordResetToken(request: Request, response: Response) {
		const customer = this.repository.passwordResetToken(
			getRepositoryContext(request),
			request.body,
		);

		return response.status(200).send(customer);
	}

	passwordReset(request: Request, response: Response) {
		const customer = this.repository.passwordReset(
			getRepositoryContext(request),
			request.body,
		);

		return response.status(200).send(customer);
	}

	confirmEmailToken(request: Request, response: Response) {
		const id = request.body.id;
		const token = this.repository.verifyEmailToken(
			getRepositoryContext(request),
			id,
		);
		return response.status(200).send(token);
	}
}
