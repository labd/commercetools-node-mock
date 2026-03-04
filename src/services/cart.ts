import type {
	Cart,
	CartDraft,
	InvalidInputError,
	Order,
	ReplicaCartDraft,
} from "@commercetools/platform-sdk";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
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

	async replicate(
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
				? await this.orderRepository.get(context, body.reference.id)
				: await this.repository.get(context, body.reference.id);

		if (!cartOrOrder) {
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message: `The referenced ${body.reference.typeId} with ID '${body.reference.id}' was not found.`,
				},
				400,
			);
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

		const newCart = await this.repository.create(context, cartDraft);

		return reply.status(200).send(newCart);
	}
}
