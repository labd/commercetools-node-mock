import type {
	CustomLineItemReturnItem,
	InvalidInputError,
	LineItemReturnItem,
	Order,
	OrderAddParcelToDeliveryAction,
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
	Parcel,
	ReturnInfo,
	State,
	Store,
	SyncInfo,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import { getBaseResourceProperties } from "~src/helpers";
import type { Writable } from "~src/types";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler } from "../abstract";
import { createAddress, createCustomFields } from "../helpers";

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

	addParcelToDelivery(
		context: RepositoryContext,
		resource: Writable<Order>,
		{
			deliveryId,
			deliveryKey,
			parcelKey,
			measurements,
			trackingData,
			items,
			custom,
		}: OrderAddParcelToDeliveryAction,
	) {
		if (!resource.shippingInfo) {
			throw new CommercetoolsError<InvalidInputError>({
				code: "InvalidInput",
				message: "Order has no shipping info",
				errors: [
					{
						code: "InvalidInput",
						message: "Order has no shipping info",
					},
				],
			});
		}

		if (!deliveryId && !deliveryKey) {
			throw new CommercetoolsError<InvalidInputError>({
				code: "InvalidInput",
				message: "Either deliveryId or deliveryKey must be provided",
				errors: [
					{
						code: "InvalidInput",
						message: "Either deliveryId or deliveryKey must be provided",
					},
				],
			});
		}

		// Find the delivery by id or key
		let targetDelivery = null;
		for (const delivery of resource.shippingInfo.deliveries || []) {
			if (
				(deliveryId && delivery.id === deliveryId) ||
				(deliveryKey && delivery.key === deliveryKey)
			) {
				targetDelivery = delivery;
				break;
			}
		}

		if (!targetDelivery) {
			const identifier = deliveryId || deliveryKey;
			const message = `Delivery with ${deliveryId ? "id" : "key"} '${identifier}' not found`;
			throw new CommercetoolsError<InvalidInputError>({
				code: "InvalidInput",
				message,
				errors: [
					{
						code: "InvalidInput",
						message,
					},
				],
			});
		}

		// Create the new parcel
		const newParcel: Parcel = {
			...getBaseResourceProperties(),
			...(parcelKey && { key: parcelKey }),
			...(measurements && { measurements }),
			...(trackingData && { trackingData }),
			items: items || [],
			...(custom && {
				custom: createCustomFields(custom, context.projectKey, this._storage),
			}),
		};

		// Add the parcel to the delivery
		if (!targetDelivery.parcels) {
			targetDelivery.parcels = [];
		}
		targetDelivery.parcels.push(newParcel);
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
		if (!resource.shippingInfo) {
			throw new Error("Resource has no shipping info");
		}

		for (const delivery of resource.shippingInfo.deliveries || []) {
			if (delivery.id === deliveryId && delivery.custom?.fields) {
				delivery.custom.fields[name] = value;
			}
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
		if (!resource.shippingInfo) {
			throw new Error("Resource has no shipping info");
		}

		for (const delivery of resource.shippingInfo.deliveries || []) {
			for (const parcel of delivery.parcels || []) {
				if (parcel.id === parcelId && parcel.custom?.fields) {
					parcel.custom.fields[name] = value;
				}
			}
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
