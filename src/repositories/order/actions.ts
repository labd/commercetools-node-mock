import type {
	CustomLineItemReturnItem,
	LineItemReturnItem,
	Order,
	OrderAddPaymentAction,
	OrderAddReturnInfoAction,
	OrderChangeOrderStateAction,
	OrderChangePaymentStateAction,
	OrderChangeShipmentStateAction,
	OrderSetBillingAddressAction,
	OrderSetCustomFieldAction,
	OrderSetCustomTypeAction,
	OrderSetCustomerEmailAction,
	OrderSetCustomerIdAction,
	OrderSetDeliveryCustomFieldAction,
	OrderSetLocaleAction,
	OrderSetOrderNumberAction,
	OrderSetParcelCustomFieldAction,
	OrderSetPurchaseOrderNumberAction,
	OrderSetShippingAddressAction,
	OrderSetStoreAction,
	OrderTransitionStateAction,
	OrderUpdateAction,
	OrderUpdateSyncInfoAction,
	ReturnInfo,
	State,
	Store,
	SyncInfo,
} from "@commercetools/platform-sdk";
import assert from "assert";
import { getBaseResourceProperties } from "~src/helpers";
import type { Writable } from "~src/types";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler } from "../abstract";
import { createAddress } from "../helpers";

export class OrderUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Order, OrderUpdateAction>>
{
	addPayment(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ payment }: OrderAddPaymentAction,
	) {
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
	}

	addReturnInfo(
		context: RepositoryContext,
		resource: Writable<Order>,
		info: OrderAddReturnInfoAction,
	) {
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
	}

	changeOrderState(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ orderState }: OrderChangeOrderStateAction,
	) {
		resource.orderState = orderState;
	}

	changePaymentState(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ paymentState }: OrderChangePaymentStateAction,
	) {
		resource.paymentState = paymentState;
	}

	changeShipmentState(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ shipmentState }: OrderChangeShipmentStateAction,
	) {
		resource.shipmentState = shipmentState;
	}

	setBillingAddress(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ address }: OrderSetBillingAddressAction,
	) {
		resource.billingAddress = createAddress(
			address,
			context.projectKey,
			this._storage,
		);
	}

	setCustomerEmail(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ email }: OrderSetCustomerEmailAction,
	) {
		resource.customerEmail = email;
	}

	setCustomerId(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ customerId }: OrderSetCustomerIdAction,
	) {
		resource.customerId = customerId;
	}

	setCustomField(
		context: RepositoryContext,
		resource: Order,
		{ name, value }: OrderSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ type, fields }: OrderSetCustomTypeAction,
	) {
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
	}

	setDeliveryCustomField(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ deliveryId, name, value }: OrderSetDeliveryCustomFieldAction,
	) {
		assert(resource.shippingInfo, "shippingInfo is not defined");

		if (Array.isArray(resource.shippingInfo.deliveries)) {
			resource.shippingInfo.deliveries.map((delivery) => {
				if (delivery.id !== deliveryId) throw "No matching delivery id found";
				if (delivery.custom) {
					const update = delivery.custom.fields;
					update[name] = value;
					Object.assign(delivery.custom.fields, update);
				}
				return delivery;
			});
		}
	}

	setLocale(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ locale }: OrderSetLocaleAction,
	) {
		resource.locale = locale;
	}

	setOrderNumber(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ orderNumber }: OrderSetOrderNumberAction,
	) {
		resource.orderNumber = orderNumber;
	}

	setParcelCustomField(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ parcelId, name, value }: OrderSetParcelCustomFieldAction,
	) {
		assert(resource.shippingInfo, "shippingInfo is not defined");

		if (Array.isArray(resource.shippingInfo.deliveries)) {
			resource.shippingInfo.deliveries.map((delivery) => {
				if (Array.isArray(delivery.parcels)) {
					delivery.parcels.map((parcel) => {
						if (parcel.id !== parcelId) throw "No matching parcel id found";
						if (parcel.custom) {
							const update = parcel.custom.fields;
							update[name] = value;
							Object.assign(parcel.custom.fields, update);
						}
						return parcel;
					});
				}
				return delivery;
			});
		}
	}

	setPurchaseOrderNumber(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ purchaseOrderNumber }: OrderSetPurchaseOrderNumberAction,
	) {
		resource.purchaseOrderNumber = purchaseOrderNumber;
	}

	setShippingAddress(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ address }: OrderSetShippingAddressAction,
	) {
		resource.shippingAddress = createAddress(
			address,
			context.projectKey,
			this._storage,
		);
	}

	setStore(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ store }: OrderSetStoreAction,
	) {
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
	}

	transitionState(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ state }: OrderTransitionStateAction,
	) {
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
	}

	updateSyncInfo(
		context: RepositoryContext,
		resource: Writable<Order>,
		{ channel, externalId, syncedAt }: OrderUpdateSyncInfoAction,
	) {
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
	}
}
