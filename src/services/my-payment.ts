import type { FastifyInstance } from "fastify";
import type { PaymentRepository } from "../repositories/payment/index.ts";
import AbstractMyService, { type MyResourceRules } from "./abstract-my.ts";

export class MyPaymentService extends AbstractMyService {
	public repository: PaymentRepository;

	protected myRules: MyResourceRules = {
		customerWhere: (customerId) => `customer(id="${customerId}")`,
		anonymousWhere: (anonymousId) => `anonymousId="${anonymousId}"`,
		customerOf: (payment) => payment.customer?.id,
		anonymousOf: (payment) => payment.anonymousId,
		stampDraft: (draft, identity) =>
			identity.type === "customer"
				? {
						...draft,
						customer: draft.customer ?? {
							typeId: "customer",
							id: identity.id,
						},
					}
				: { ...draft, anonymousId: draft.anonymousId ?? identity.id },
	};

	constructor(parent: FastifyInstance, repository: PaymentRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "me/payments";
	}
}
