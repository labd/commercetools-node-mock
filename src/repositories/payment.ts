import type {
	CustomerReference,
	Payment,
	PaymentAddInterfaceInteractionAction,
	PaymentAddTransactionAction,
	PaymentChangeAmountPlannedAction,
	PaymentChangeTransactionInteractionIdAction,
	PaymentChangeTransactionStateAction,
	PaymentChangeTransactionTimestampAction,
	PaymentDraft,
	PaymentSetAnonymousIdAction,
	PaymentSetCustomFieldAction,
	PaymentSetCustomTypeAction,
	PaymentSetCustomerAction,
	PaymentSetInterfaceIdAction,
	PaymentSetKeyAction,
	PaymentSetMethodInfoInterfaceAction,
	PaymentSetMethodInfoMethodAction,
	PaymentSetMethodInfoNameAction,
	PaymentSetStatusInterfaceCodeAction,
	PaymentSetStatusInterfaceTextAction,
	PaymentSetTransactionCustomFieldAction,
	PaymentSetTransactionCustomTypeAction,
	PaymentTransitionStateAction,
	PaymentUpdateAction,
	State,
	StateReference,
	Transaction,
	TransactionDraft,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import { AbstractResourceRepository, RepositoryContext } from "./abstract";
import {
	createCentPrecisionMoney,
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "./helpers";

export class PaymentRepository extends AbstractResourceRepository<"payment"> {
	getTypeId() {
		return "payment" as const;
	}

	create(context: RepositoryContext, draft: PaymentDraft): Payment {
		const resource: Payment = {
			...getBaseResourceProperties(),
			amountPlanned: createCentPrecisionMoney(draft.amountPlanned),
			paymentMethodInfo: draft.paymentMethodInfo!,
			paymentStatus: draft.paymentStatus
				? {
						...draft.paymentStatus,
						state: draft.paymentStatus.state
							? getReferenceFromResourceIdentifier<StateReference>(
									draft.paymentStatus.state,
									context.projectKey,
									this._storage,
								)
							: undefined,
					}
				: {},
			transactions: (draft.transactions || []).map((t) =>
				this.transactionFromTransactionDraft(t, context),
			),
			interfaceInteractions: (draft.interfaceInteractions || []).map(
				(interaction) =>
					createCustomFields(interaction, context.projectKey, this._storage)!,
			),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};

		return this.saveNew(context, resource);
	}

	transactionFromTransactionDraft = (
		draft: TransactionDraft,
		context: RepositoryContext,
	): Transaction => ({
		...draft,
		id: uuidv4(),
		amount: createCentPrecisionMoney(draft.amount),
		custom: createCustomFields(draft.custom, context.projectKey, this._storage),
		state: draft.state ?? "Initial", // Documented as default
	});

	actions: Record<
		PaymentUpdateAction["action"],
		(
			context: RepositoryContext,
			resource: Writable<Payment>,
			action: any,
		) => void
	> = {
		addInterfaceInteraction: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ type, fields }: PaymentAddInterfaceInteractionAction,
		) => {
			resource.interfaceInteractions.push(
				createCustomFields(
					{ type, fields },
					context.projectKey,
					this._storage,
				)!,
			);
		},
		addTransaction: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ transaction }: PaymentAddTransactionAction,
		) => {
			resource.transactions = [
				...resource.transactions,
				this.transactionFromTransactionDraft(transaction, context),
			];
		},
		changeAmountPlanned: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ amount }: PaymentChangeAmountPlannedAction,
		) => {
			resource.amountPlanned = createCentPrecisionMoney(amount);
		},
		changeTransactionInteractionId: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{
				transactionId,
				interactionId,
			}: PaymentChangeTransactionInteractionIdAction,
		) => {
			const transaction = resource.transactions.find(
				(e: Transaction) => e.id === transactionId,
			);
			if (transaction) {
				transaction.interactionId = interactionId;
			}
		},
		changeTransactionState: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ transactionId, state }: PaymentChangeTransactionStateAction,
		) => {
			const index = resource.transactions.findIndex(
				(e: Transaction) => e.id === transactionId,
			);
			const updatedTransaction: Transaction = {
				...resource.transactions[index],
				state,
			};
			resource.transactions[index] = updatedTransaction;
		},
		changeTransactionTimestamp: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ transactionId, timestamp }: PaymentChangeTransactionTimestampAction,
		) => {
			const transaction = resource.transactions.find(
				(e: Transaction) => e.id === transactionId,
			);
			if (transaction) {
				transaction.timestamp = timestamp;
			}
		},
		transitionState: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ state }: PaymentTransitionStateAction,
		) => {
			const stateObj = this._storage.getByResourceIdentifier(
				context.projectKey,
				state,
			) as State | null;

			if (!stateObj) {
				throw new Error(`State ${state} not found`);
			}

			resource.paymentStatus.state = {
				typeId: "state",
				id: stateObj.id,
				obj: stateObj,
			};
		},
		setAnonymousId: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ anonymousId }: PaymentSetAnonymousIdAction,
		) => {
			resource.anonymousId = anonymousId;
			resource.customer = undefined;
		},
		setCustomer: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ customer }: PaymentSetCustomerAction,
		) => {
			if (customer) {
				const c = getReferenceFromResourceIdentifier<CustomerReference>(
					customer,
					_context.projectKey,
					this._storage,
				);
				resource.customer = c;
				resource.anonymousId = undefined;
			}
		},
		setCustomField: (
			context: RepositoryContext,
			resource: Payment,
			{ name, value }: PaymentSetCustomFieldAction,
		) => {
			if (!resource.custom) {
				throw new Error("Resource has no custom field");
			}

			resource.custom.fields[name] = value;
		},
		setCustomType: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ type, fields }: PaymentSetCustomTypeAction,
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
					fields: fields ?? {},
				};
			}
		},
		setInterfaceId: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ interfaceId }: PaymentSetInterfaceIdAction,
		) => {
			resource.interfaceId = interfaceId;
		},
		setKey: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ key }: PaymentSetKeyAction,
		) => {
			resource.key = key;
		},
		setMethodInfoMethod: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ method }: PaymentSetMethodInfoMethodAction,
		) => {
			resource.paymentMethodInfo.method = method;
		},
		setMethodInfoName: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ name }: PaymentSetMethodInfoNameAction,
		) => {
			resource.paymentMethodInfo.name = name;
		},
		setMethodInfoInterface: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			args: PaymentSetMethodInfoInterfaceAction,
		) => {
			resource.paymentMethodInfo.paymentInterface = args.interface;
		},
		setStatusInterfaceCode: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ interfaceCode }: PaymentSetStatusInterfaceCodeAction,
		) => {
			resource.paymentStatus.interfaceCode = interfaceCode;
		},
		setStatusInterfaceText: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ interfaceText }: PaymentSetStatusInterfaceTextAction,
		) => {
			resource.paymentStatus.interfaceText = interfaceText;
		},
		setTransactionCustomField: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ transactionId, name, value }: PaymentSetTransactionCustomFieldAction,
		) => {
			const transaction = resource.transactions.find(
				(e: Transaction) => e.id === transactionId,
			);
			if (transaction) {
				if (!transaction.custom) {
					throw new Error("Transaction has no custom field");
				}

				transaction.custom.fields[name] = value;
			}
		},
		setTransactionCustomType: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ transactionId, type, fields }: PaymentSetTransactionCustomTypeAction,
		) => {
			const transaction = resource.transactions.find(
				(e: Transaction) => e.id === transactionId,
			);
			if (transaction) {
				if (!type) {
					transaction.custom = undefined;
				} else {
					const resolvedType = this._storage.getByResourceIdentifier(
						context.projectKey,
						type,
					);
					if (!resolvedType) {
						throw new Error(`Type ${type} not found`);
					}

					transaction.custom = {
						type: {
							typeId: "type",
							id: resolvedType.id,
						},
						fields: fields ?? {},
					};
				}
			}
		},
	};
}
