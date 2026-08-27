import type { MyOrderFromQuoteDraft } from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MyOrderFromQuoteDraftSchema } from "#src/schemas/generated/my-order-from-quote.ts";
import { validateDraft } from "#src/validate.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { MyOrderRepository } from "../repositories/my-order.ts";
import AbstractService from "./abstract.ts";

export class MyOrderService extends AbstractService {
	public repository: MyOrderRepository;

	constructor(parent: FastifyInstance, repository: MyOrderRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me";
	}

	registerRoutes(parent: FastifyInstance) {
		// Overwrite this function to be able to handle /me/active-cart path.
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("/orders", this.get.bind(this));
				instance.get("/orders/:id", this.getWithId.bind(this));

				instance.delete("/orders/:id", this.deleteWithId.bind(this));

				instance.post("/orders/quotes", this.createFromQuote.bind(this));
				instance.post("/orders", this.post.bind(this));
				instance.post("/orders/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}

	async createFromQuote(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: MyOrderFromQuoteDraft;
		}>,
		reply: FastifyReply,
	) {
		if (this.repository.strict) {
			validateDraft(request.body, MyOrderFromQuoteDraftSchema);
		}

		const { id, version, quoteStateToAccepted } = request.body;
		const resource = await this.repository.createFromQuote(
			getRepositoryContext(request),
			{
				quote: { typeId: "quote", id },
				version,
				quoteStateToAccepted,
			},
		);
		return reply.status(this.createStatusCode).send(resource);
	}
}
