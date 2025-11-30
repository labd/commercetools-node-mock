import assert from "node:assert";
import type {
	Cart,
	CartReference,
	MyQuoteRequestDraft,
	QuoteRequest,
	QuoteRequestDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { QuoteRequestUpdateHandler } from "./actions.ts";

export class QuoteRequestRepository extends AbstractResourceRepository<"quote-request"> {
	constructor(config: Config) {
		super("quote-request", config);
		this.actions = new QuoteRequestUpdateHandler(config.storage);
	}

	create(
		context: RepositoryContext,
		draft: QuoteRequestDraft | MyQuoteRequestDraft,
	): QuoteRequest {
		// Handle the 'my' version of the draft
		if ("cartId" in draft) {
			return this.createFromCart(context, {
				id: draft.cartId,
				typeId: "cart",
			});
		}

		assert(draft.cart, "draft.cart is missing");
		return this.createFromCart(context, {
			id: draft.cart.id!,
			typeId: "cart",
		});
	}

	createFromCart(context: RepositoryContext, cartReference: CartReference) {
		const cart = this._storage.getByResourceIdentifier(
			context.projectKey,
			cartReference,
		) as Cart | null;
		if (!cart) {
			throw new Error("Cannot find cart");
		}

		if (!cart.customerId) {
			throw new Error("Cart does not have a customer");
		}

		const resource: QuoteRequest = {
			...getBaseResourceProperties(),
			billingAddress: cart.billingAddress,
			cart: cartReference,
			country: cart.country,
			custom: cart.custom,
			customer: {
				typeId: "customer",
				id: cart.customerId,
			},
			customerGroup: cart.customerGroup,
			customLineItems: [],
			directDiscounts: cart.directDiscounts,
			lineItems: cart.lineItems,
			paymentInfo: cart.paymentInfo,
			priceRoundingMode: cart.priceRoundingMode,
			quoteRequestState: "Submitted",
			shippingAddress: cart.shippingAddress,
			taxCalculationMode: cart.taxCalculationMode,
			taxedPrice: cart.taxedPrice,
			taxMode: cart.taxMode,
			taxRoundingMode: cart.taxRoundingMode,
			totalPrice: cart.totalPrice,
			store: cart.store,
		};
		return this.saveNew(context, resource);
	}
}
