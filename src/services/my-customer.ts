import { Update } from "@commercetools/platform-sdk";
import { Request, Response, Router } from "express";
import { updateRequestSchema } from "~src/schemas/update-request";
import { validateData } from "~src/validate";
import { hashPassword } from "../lib/password";
import { getRepositoryContext } from "../repositories/helpers";
import { MyCustomerRepository } from "../repositories/my-customer";
import AbstractService from "./abstract";

export class MyCustomerService extends AbstractService {
	public repository: MyCustomerRepository;

	constructor(parent: Router, repository: MyCustomerRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me";
	}

	registerRoutes(parent: Router) {
		// Overwrite this function to be able to handle /me path.
		const basePath = this.getBasePath();
		const router = Router({ mergeParams: true });

		this.extraRoutes(router);

		router.get("", this.getMe.bind(this));
		router.post("", this.updateMe.bind(this));
		router.delete("", this.deleteMe.bind(this));

		router.post("/signup", this.signUp.bind(this));

		router.post("/login", this.signIn.bind(this));
		router.post("/password", this.changePassword.bind(this));
		router.post("/password/reset", this.resetPassword.bind(this));
		router.post("/email/confirm", this.emailConfirm.bind(this));

		parent.use(`/${basePath}`, router);
	}

	getMe(request: Request, response: Response) {
		const resource = this.repository.getMe(getRepositoryContext(request));
		if (!resource) {
			return response.status(404).send("Not found");
		}
		return response.status(200).send(resource);
	}

	updateMe(request: Request, response: Response) {
		const resource = this.repository.getMe(getRepositoryContext(request));

		if (!resource) {
			return response.status(404).send("Not found");
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
		return response.status(200).send(result);
	}

	deleteMe(request: Request, response: Response) {
		const resource = this.repository.deleteMe(getRepositoryContext(request));
		if (!resource) {
			return response.status(404).send("Not found");
		}

		return response.status(200).send(resource);
	}

	signUp(request: Request, response: Response) {
		const draft = request.body;
		const resource = this.repository.create(
			getRepositoryContext(request),
			draft,
		);
		const result = this._expandWithId(request, resource.id);
		return response.status(this.createStatusCode).send({ customer: result });
	}

	changePassword(request: Request, response: Response) {
		const customer = this.repository.changePassword(
			getRepositoryContext(request),
			request.body,
		);

		return response.status(200).send(customer);
	}

	resetPassword(request: Request, response: Response) {
		const customer = this.repository.passwordReset(
			getRepositoryContext(request),
			request.body,
		);

		return response.status(200).send(customer);
	}

	emailConfirm(request: Request, response: Response) {
		const customer = this.repository.confirmEmail(
			getRepositoryContext(request),
			request.body,
		);

		return response.status(200).send(customer);
	}

	signIn(request: Request, response: Response) {
		const { email, password } = request.body;
		const encodedPassword = hashPassword(password);

		const result = this.repository.query(getRepositoryContext(request), {
			where: [`email = "${email}"`, `password = "${encodedPassword}"`],
		});

		if (result.count === 0) {
			return response.status(400).send({
				message: "Account with the given credentials not found.",
				errors: [
					{
						code: "InvalidCredentials",
						message: "Account with the given credentials not found.",
					},
				],
			});
		}

		return response.status(200).send({ customer: result.results[0] });
	}
}
