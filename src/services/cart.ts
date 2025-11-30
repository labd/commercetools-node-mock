import type { Cart, CartDraft, Order } from "@commercetools/platform-sdk";
import type { Request, Response, Router } from "express";
import type { CartRepository } from "../repositories/cart/index.ts";
import { getRepositoryContext } from "../repositories/helpers.ts";
import type { OrderRepository } from "../repositories/order/index.ts";
import AbstractService from "./abstract.ts";

export class CartService extends AbstractService {
	public repository: CartRepository;

	public orderRepository: OrderRepository;

	constructor(
		parent: Router,
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

	extraRoutes(parent: Router) {
		parent.post("/replicate", this.replicate.bind(this));
	}

	replicate(request: Request, response: Response) {
		const context = getRepositoryContext(request);

		const cartOrOrder: Cart | Order | null =
			request.body.reference.typeId === "order"
				? this.orderRepository.get(context, request.body.reference.id)
				: this.repository.get(context, request.body.reference.id);

		if (!cartOrOrder) {
			response.status(400).send();
			return;
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

		response.status(200).send(newCart);
	}
}
