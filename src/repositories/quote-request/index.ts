import assert from "node:assert";
import type {
	Cart,
	CartReference,
	InvalidOperationError,
	MyQuoteRequestDraft,
	QuoteRequest,
	QuoteRequestDraft,
	ResourceNotFoundError,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { QuoteRequestDraftSchema } from "#src/schemas/generated/quote-request.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { QuoteRequestUpdateHandler } from "./actions.ts";

export class QuoteRequestRepository extends AbstractResourceRepository<"quote-request"> {
	constructor(config: Config) {
		super("quote-request", config);
		this.actions = new QuoteRequestUpdateHandler(config.storage);
		this.draftSchema = QuoteRequestDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: QuoteRequestDraft | MyQuoteRequestDraft,
	): Promise<QuoteRequest> {
		// Handle the 'my' version of the draft
		if ("cartId" in draft) {
			return await this.createFromCart(context, {
				id: draft.cartId,
				typeId: "cart",
			});
		}

		assert(draft.cart, "draft.cart is missing");
		return await this.createFromCart(context, {
			id: draft.cart.id!,
			typeId: "cart",
		});
	}

	async createFromCart(
		context: RepositoryContext,
		cartReference: CartReference,
	) {
		const cart = (await this._storage.getByResourceIdentifier(
			context.projectKey,
			cartReference,
		)) as Cart | null;
		if (!cart) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "Cannot find cart",
				},
				404,
			);
		}

		if (!cart.customerId) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "Cart does not have a customer",
				},
				400,
			);
		}

		const resource: QuoteRequest = {
			...getBaseResourceProperties(context.clientId),
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
		return await this.saveNew(context, resource);
	}
}
