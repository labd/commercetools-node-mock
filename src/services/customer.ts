import { CustomerSignInResult } from "@commercetools/platform-sdk";
import { Router, type Request, type Response } from "express";
import { CustomerRepository } from "../repositories/customer";
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

	extraRoutes(parent: Router) {
		parent.post("/password-token", (request, response) => {
			const email = request.body.email;
			const token = this.repository.passwordResetToken(
				getRepositoryContext(request),
				email,
			);
			return response.status(200).send(token);
		});

		parent.post("/email-token", (request, response) => {
			const id = request.body.id;
			const token = this.repository.verifyEmailToken(
				getRepositoryContext(request),
				id,
			);
			return response.status(200).send(token);
		});
	}
}
