import type {
	Cart,
	CartReference,
	CustomLineItem,
	CustomLineItemImportDraft,
	CustomLineItemReturnItem,
	GeneralError,
	LineItem,
	LineItemImportDraft,
	LineItemReturnItem,
	Order,
	OrderAddPaymentAction,
	OrderAddReturnInfoAction,
	OrderChangeOrderStateAction,
	OrderChangePaymentStateAction,
	OrderFromCartDraft,
	OrderImportDraft,
	OrderSetBillingAddressAction,
	OrderSetCustomFieldAction,
	OrderSetCustomTypeAction,
	OrderSetCustomerEmailAction,
	OrderSetLocaleAction,
	OrderSetOrderNumberAction,
	OrderSetShippingAddressAction,
	OrderSetStoreAction,
	OrderTransitionStateAction,
	OrderUpdateSyncInfoAction,
	Product,
	ProductPagedQueryResponse,
	ProductVariant,
	ReturnInfo,
	State,
	Store,
	SyncInfo,
} from "@commercetools/platform-sdk";
import assert from "assert";
import { CommercetoolsError } from "../exceptions";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import {
	AbstractResourceRepository,
	RepositoryContext,
	type QueryParams,
} from "./abstract";
import {
	createAddress,
	createCentPrecisionMoney,
	createCustomFields,
	createPrice,
	createTypedMoney,
	resolveStoreReference,
} from "./helpers";

export class OrderRepository extends AbstractResourceRepository<"order"> {
	getTypeId() {
		return "order" as const;
	}

	create(context: RepositoryContext, draft: OrderFromCartDraft): Order {
		assert(draft.cart, "draft.cart is missing");
		return this.createFromCart(
			context,
			{
				id: draft.cart.id!,
				typeId: "cart",
			},
			draft.orderNumber,
		);
	}

	createFromCart(
		context: RepositoryContext,
		cartReference: CartReference,
		orderNumber?: string,
	) {
		const cart = this._storage.getByResourceIdentifier(
			context.projectKey,
			cartReference,
		) as Cart | null;
		if (!cart) {
			throw new Error("Cannot find cart");
		}

		const resource: Order = {
			...getBaseResourceProperties(),
			orderNumber,
			cart: cartReference,
			orderState: "Open",
			lineItems: [],
			customLineItems: [],
			totalPrice: cart.totalPrice,
			refusedGifts: [],
			origin: "Customer",
			syncInfo: [],
			shippingMode: cart.shippingMode,
			shipping: cart.shipping,
			store: context.storeKey
				? {
						key: context.storeKey,
						typeId: "store",
					}
				: undefined,
			lastMessageSequenceNumber: 0,
		};
		return this.saveNew(context, resource);
	}

	import(context: RepositoryContext, draft: OrderImportDraft): Order {
		// TODO: Check if order with given orderNumber already exists
		assert(this, "OrderRepository not valid");
		const resource: Order = {
			...getBaseResourceProperties(),

			billingAddress: createAddress(
				draft.billingAddress,
				context.projectKey,
				this._storage,
			),
			shippingAddress: createAddress(
				draft.shippingAddress,
				context.projectKey,
				this._storage,
			),

			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			customerEmail: draft.customerEmail,
			lastMessageSequenceNumber: 0,
			orderNumber: draft.orderNumber,
			orderState: draft.orderState || "Open",
			origin: draft.origin || "Customer",
			paymentState: draft.paymentState,
			refusedGifts: [],
			shippingMode: "Single",
			shipping: [],

			store: resolveStoreReference(
				draft.store,
				context.projectKey,
				this._storage,
			),
			syncInfo: [],

			lineItems:
				draft.lineItems?.map((item) =>
					this.lineItemFromImportDraft.bind(this)(context, item),
				) || [],
			customLineItems:
				draft.customLineItems?.map((item) =>
					this.customLineItemFromImportDraft.bind(this)(context, item),
				) || [],

			totalPrice: createCentPrecisionMoney(draft.totalPrice),
		};
		return this.saveNew(context, resource);
	}

	private lineItemFromImportDraft(
		context: RepositoryContext,
		draft: LineItemImportDraft,
	): LineItem {
		let product: Product;
		let variant: ProductVariant | undefined;

		if (draft.variant.sku) {
			variant = {
				id: 0,
				sku: draft.variant.sku,
			};

			const items = this._storage.query(context.projectKey, "product", {
				where: [
					`masterData(current(masterVariant(sku="${draft.variant.sku}"))) or masterData(current(variants(sku="${draft.variant.sku}")))`,
				],
			}) as ProductPagedQueryResponse;

			if (items.count !== 1) {
				throw new CommercetoolsError<GeneralError>({
					code: "General",
					message: `A product containing a variant with SKU '${draft.variant.sku}' not found.`,
				});
			}

			product = items.results[0];
			if (product.masterData.current.masterVariant.sku === draft.variant.sku) {
				variant = product.masterData.current.masterVariant;
			} else {
				variant = product.masterData.current.variants.find(
					(v) => v.sku === draft.variant.sku,
				);
			}
			if (!variant) {
				throw new Error("Internal state error");
			}
		} else {
			throw new Error("No product found");
		}

		const lineItem: LineItem = {
			...getBaseResourceProperties(),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			discountedPricePerQuantity: [],
			lineItemMode: "Standard",
			name: draft.name,
			price: createPrice(draft.price),
			priceMode: "Platform",
			productId: product.id,
			productType: product.productType,
			quantity: draft.quantity,
			state: draft.state || [],
			taxRate: draft.taxRate,
			taxedPricePortions: [],
			perMethodTaxRate: [],
			totalPrice: createCentPrecisionMoney(draft.price.value),
			variant: {
				id: variant.id,
				sku: variant.sku,
				price: createPrice(draft.price),
			},
		};

		return lineItem;
	}

	private customLineItemFromImportDraft(
		context: RepositoryContext,
		draft: CustomLineItemImportDraft,
	): CustomLineItem {
		const lineItem: CustomLineItem = {
			...getBaseResourceProperties(),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			discountedPricePerQuantity: [],
			money: createTypedMoney(draft.money),
			name: draft.name,
			quantity: draft.quantity ?? 0,
			perMethodTaxRate: [],
			priceMode: draft.priceMode ?? "Standard",
			slug: draft.slug,
			state: [],
			totalPrice: createCentPrecisionMoney(draft.money),
			taxedPricePortions: [],
		};

		return lineItem;
	}

	getWithOrderNumber(
		context: RepositoryContext,
		orderNumber: string,
		params: QueryParams = {},
	): Order | undefined {
		const result = this._storage.query(context.projectKey, this.getTypeId(), {
			...params,
			where: [`orderNumber="${orderNumber}"`],
		});
		if (result.count === 1) {
			return result.results[0] as Order;
		}

		// Catch this for now, should be checked when creating/updating
		if (result.count > 1) {
			throw new Error("Duplicate order numbers");
		}

		return;
	}

	actions = {
		addPayment: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ payment }: OrderAddPaymentAction,
		) => {
			const resolvedPayment = this._storage.getByResourceIdentifier(
				context.projectKey,
				payment,
			);
			if (!resolvedPayment) {
				throw new Error(`Payment ${payment.id} not found`);
			}

			if (!resource.paymentInfo) {
				resource.paymentInfo = {
					payments: [],
				};
			}

			resource.paymentInfo.payments.push({
				typeId: "payment",
				id: payment.id!,
			});
		},

		addReturnInfo: (
			context: RepositoryContext,
			resource: Writable<Order>,
			info: OrderAddReturnInfoAction,
		) => {
			if (!resource.returnInfo) {
				resource.returnInfo = [];
			}

			const resolved: ReturnInfo = {
				items: info.items.map((item) => {
					const common = {
						...getBaseResourceProperties(),
						quantity: item.quantity,
						paymentState: "Initial",
						shipmentState: "Initial",
						comment: item.comment,
					};
					if (item.customLineItemId) {
						return {
							...common,
							type: "CustomLineItemReturnItem",
							customLineItemId: item.customLineItemId,
						} as CustomLineItemReturnItem;
					}
					return {
						...common,
						type: "LineItemReturnItem",
						lineItemId: item.customLineItemId || item.lineItemId,
					} as LineItemReturnItem;
				}),
				returnTrackingId: info.returnTrackingId,
				returnDate: info.returnDate,
			};

			resource.returnInfo.push(resolved);
		},
		changeOrderState: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ orderState }: OrderChangeOrderStateAction,
		) => {
			resource.orderState = orderState;
		},
		changePaymentState: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ paymentState }: OrderChangePaymentStateAction,
		) => {
			resource.paymentState = paymentState;
		},
		transitionState: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ state }: OrderTransitionStateAction,
		) => {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				state,
			) as State | null;

			if (!resolvedType) {
				throw new Error(
					`No state found with key=${state.key} or id=${state.key}`,
				);
			}

			resource.state = {
				typeId: "state",
				id: resolvedType.id,
				obj: { ...resolvedType, key: state.key ?? "" },
			};
		},
		setBillingAddress: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ address }: OrderSetBillingAddressAction,
		) => {
			resource.billingAddress = createAddress(
				address,
				context.projectKey,
				this._storage,
			);
		},
		setCustomerEmail: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ email }: OrderSetCustomerEmailAction,
		) => {
			resource.customerEmail = email;
		},
		setCustomField: (
			context: RepositoryContext,
			resource: Order,
			{ name, value }: OrderSetCustomFieldAction,
		) => {
			if (!resource.custom) {
				throw new Error("Resource has no custom field");
			}
			resource.custom.fields[name] = value;
		},
		setCustomType: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ type, fields }: OrderSetCustomTypeAction,
		) => {
			if (!type) {
				resource.custom = undefined;
			} else {
				const resolvedType = this._storage.getByResourceIdentifier(
					context.projectKey,
					type,
				);
				if (!resolvedType) {
					throw new Error(`Type ${type} not found`);
				}

				resource.custom = {
					type: {
						typeId: "type",
						id: resolvedType.id,
					},
					fields: fields || {},
				};
			}
		},
		setLocale: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ locale }: OrderSetLocaleAction,
		) => {
			resource.locale = locale;
		},
		setOrderNumber: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ orderNumber }: OrderSetOrderNumberAction,
		) => {
			resource.orderNumber = orderNumber;
		},
		setShippingAddress: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ address }: OrderSetShippingAddressAction,
		) => {
			resource.shippingAddress = createAddress(
				address,
				context.projectKey,
				this._storage,
			);
		},
		setStore: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ store }: OrderSetStoreAction,
		) => {
			if (!store) return;
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				store,
			);
			if (!resolvedType) {
				throw new Error(`No store found with key=${store.key}`);
			}

			const storeReference = resolvedType as Store;
			resource.store = {
				typeId: "store",
				key: storeReference.key,
			};
		},
		updateSyncInfo: (
			context: RepositoryContext,
			resource: Writable<Order>,
			{ channel, externalId, syncedAt }: OrderUpdateSyncInfoAction,
		) => {
			if (!channel) return;
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				channel,
			);
			if (!resolvedType) {
				throw new Error(`Channel ${channel} not found`);
			}

			const syncData: SyncInfo = {
				channel: {
					typeId: "channel",
					id: resolvedType.id,
				},
				externalId,
				syncedAt: syncedAt ?? new Date().toISOString(),
			};

			if (!resource.syncInfo?.length) {
				resource.syncInfo = [syncData];
			} else {
				const lastSyncInfo = resource.syncInfo[resource.syncInfo.length - 1];
				if (
					lastSyncInfo.channel.id !== syncData.channel.id ||
					lastSyncInfo.externalId !== syncData.externalId
				) {
					resource.syncInfo.push(syncData);
				}
			}
		},
	};
}
