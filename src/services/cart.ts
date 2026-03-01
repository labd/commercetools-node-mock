import type {
	Cart,
	CartDraft,
	Order,
	ReplicaCartDraft,
} from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { CartRepository } from "../repositories/cart/index.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { OrderRepository } from "../repositories/order/index.ts";
import AbstractService from "./abstract.ts";

export class CartService extends AbstractService {
	public repository: CartRepository;

	public orderRepository: OrderRepository;

	constructor(
		parent: FastifyInstance,
		cartRepository: CartRepository,
		orderRepository: OrderRepository,
	) {
		super(parent);
		this.repository = cartRepository;
		this.orderRepository = orderRepository;
	}

	getBasePath() {
		return "carts";
	}

	extraRoutes(parent: FastifyInstance) {
		parent.post("/replicate", this.replicate.bind(this));
	}

	replicate(
		request: FastifyRequest<{
			Params: Record<string, string>;
			Body: ReplicaCartDraft;
		}>,
		reply: FastifyReply,
	) {
		const context = getRepositoryContext(request);
		const body = request.body;

		const cartOrOrder: Cart | Order | null =
			body.reference.typeId === "order"
				? this.orderRepository.get(context, body.reference.id)
				: this.repository.get(context, body.reference.id);

		if (!cartOrOrder) {
			return reply.status(400).send();
		}

		const cartDraft: CartDraft = {
			...cartOrOrder,
			currency: cartOrOrder.totalPrice.currencyCode,
			discountCodes: [],
			shipping: [], // TODO: cartOrOrder.shipping,
			lineItems: cartOrOrder.lineItems.map((lineItem) => ({
				...lineItem,
				variantId: lineItem.variant.id,
				sku: lineItem.variant.sku,
			})),
		};

		const newCart = this.repository.create(context, cartDraft);

		return reply.status(200).send(newCart);
	}
}
