import type {
	CustomerReference,
	Payment,
	PaymentAddInterfaceInteractionAction,
	PaymentAddTransactionAction,
	PaymentChangeAmountPlannedAction,
	PaymentChangeTransactionInteractionIdAction,
	PaymentChangeTransactionStateAction,
	PaymentChangeTransactionTimestampAction,
	PaymentSetAnonymousIdAction,
	PaymentSetCustomFieldAction,
	PaymentSetCustomTypeAction,
	PaymentSetCustomerAction,
	PaymentSetInterfaceIdAction,
	PaymentSetKeyAction,
	PaymentSetMethodInfoAction,
	PaymentSetMethodInfoCustomFieldAction,
	PaymentSetMethodInfoCustomTypeAction,
	PaymentSetMethodInfoInterfaceAccountAction,
	PaymentSetMethodInfoInterfaceAction,
	PaymentSetMethodInfoMethodAction,
	PaymentSetMethodInfoNameAction,
	PaymentSetMethodInfoTokenAction,
	PaymentSetStatusInterfaceCodeAction,
	PaymentSetStatusInterfaceTextAction,
	PaymentSetTransactionCustomFieldAction,
	PaymentSetTransactionCustomTypeAction,
	PaymentTransitionStateAction,
	PaymentUpdateAction,
	State,
	Transaction,
} from "@commercetools/platform-sdk";
import type { Writable } from "~src/types";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler } from "../abstract";
import {
	createCentPrecisionMoney,
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers";
import { transactionFromTransactionDraft } from "./helpers";

export class PaymentUpdateHandler
	extends AbstractUpdateHandler
	implements UpdateHandlerInterface<Payment, PaymentUpdateAction>
{
	addInterfaceInteraction(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{ type, fields }: PaymentAddInterfaceInteractionAction,
	) {
		resource.interfaceInteractions.push(
			createCustomFields({ type, fields }, context.projectKey, this._storage)!,
		);
	}

	addTransaction(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{ transaction }: PaymentAddTransactionAction,
	) {
		resource.transactions = [
			...resource.transactions,
			transactionFromTransactionDraft(context, this._storage, transaction),
		];
	}

	changeAmountPlanned(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ amount }: PaymentChangeAmountPlannedAction,
	) {
		resource.amountPlanned = createCentPrecisionMoney(amount);
	}

	changeTransactionInteractionId(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{
			transactionId,
			interactionId,
		}: PaymentChangeTransactionInteractionIdAction,
	) {
		const transaction = resource.transactions.find(
			(e: Transaction) => e.id === transactionId,
		);
		if (transaction) {
			transaction.interactionId = interactionId;
		}
	}

	changeTransactionState(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ transactionId, state }: PaymentChangeTransactionStateAction,
	) {
		const index = resource.transactions.findIndex(
			(e: Transaction) => e.id === transactionId,
		);
		const updatedTransaction: Transaction = {
			...resource.transactions[index],
			state,
		};
		resource.transactions[index] = updatedTransaction;
	}

	changeTransactionTimestamp(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ transactionId, timestamp }: PaymentChangeTransactionTimestampAction,
	) {
		const transaction = resource.transactions.find(
			(e: Transaction) => e.id === transactionId,
		);
		if (transaction) {
			transaction.timestamp = timestamp;
		}
	}

	setAnonymousId(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ anonymousId }: PaymentSetAnonymousIdAction,
	) {
		resource.anonymousId = anonymousId;
		resource.customer = undefined;
	}

	setCustomer(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ customer }: PaymentSetCustomerAction,
	) {
		if (customer) {
			const c = getReferenceFromResourceIdentifier<CustomerReference>(
				customer,
				_context.projectKey,
				this._storage,
			);
			resource.customer = c;
			resource.anonymousId = undefined;
		}
	}

	setCustomField(
		context: RepositoryContext,
		resource: Payment,
		{ name, value }: PaymentSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}

		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{ type, fields }: PaymentSetCustomTypeAction,
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
				fields: fields ?? {},
			};
		}
	}

	setInterfaceId(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ interfaceId }: PaymentSetInterfaceIdAction,
	) {
		resource.interfaceId = interfaceId;
	}

	setKey(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ key }: PaymentSetKeyAction,
	) {
		resource.key = key;
	}

	setMethodInfoInterface(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		args: PaymentSetMethodInfoInterfaceAction,
	) {
		resource.paymentMethodInfo.paymentInterface = args.interface;
	}

	setMethodInfoMethod(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ method }: PaymentSetMethodInfoMethodAction,
	) {
		resource.paymentMethodInfo.method = method;
	}

	setMethodInfoName(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ name }: PaymentSetMethodInfoNameAction,
	) {
		resource.paymentMethodInfo.name = name;
	}

	setStatusInterfaceCode(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ interfaceCode }: PaymentSetStatusInterfaceCodeAction,
	) {
		resource.paymentStatus.interfaceCode = interfaceCode;
	}

	setStatusInterfaceText(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ interfaceText }: PaymentSetStatusInterfaceTextAction,
	) {
		resource.paymentStatus.interfaceText = interfaceText;
	}

	setTransactionCustomField(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ transactionId, name, value }: PaymentSetTransactionCustomFieldAction,
	) {
		const transaction = resource.transactions.find(
			(e: Transaction) => e.id === transactionId,
		);
		if (transaction) {
			if (!transaction.custom) {
				throw new Error("Transaction has no custom field");
			}

			transaction.custom.fields[name] = value;
		}
	}

	setTransactionCustomType(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{ transactionId, type, fields }: PaymentSetTransactionCustomTypeAction,
	) {
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
	}

	transitionState(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{ state }: PaymentTransitionStateAction,
	) {
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
	}

	setMethodInfo(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{
			paymentInterface,
			method,
			name,
			interfaceAccount,
			token,
		}: PaymentSetMethodInfoAction,
	) {
		if (paymentInterface !== undefined) {
			resource.paymentMethodInfo.paymentInterface = paymentInterface;
		}
		if (method !== undefined) {
			resource.paymentMethodInfo.method = method;
		}
		if (name !== undefined) {
			resource.paymentMethodInfo.name = name;
		}
		if (interfaceAccount !== undefined) {
			resource.paymentMethodInfo.interfaceAccount = interfaceAccount;
		}
		if (token !== undefined) {
			resource.paymentMethodInfo.token = token;
		}
	}

	setMethodInfoCustomField(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{ name, value }: PaymentSetMethodInfoCustomFieldAction,
	) {
		if (!resource.paymentMethodInfo.custom) {
			throw new Error("PaymentMethodInfo has no custom field");
		}

		resource.paymentMethodInfo.custom.fields[name] = value;
	}

	setMethodInfoCustomType(
		context: RepositoryContext,
		resource: Writable<Payment>,
		{ type, fields }: PaymentSetMethodInfoCustomTypeAction,
	) {
		if (!type) {
			resource.paymentMethodInfo.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new Error(`Type ${type} not found`);
			}

			resource.paymentMethodInfo.custom = {
				type: {
					typeId: "type",
					id: resolvedType.id,
				},
				fields: fields ?? {},
			};
		}
	}

	setMethodInfoInterfaceAccount(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ interfaceAccount }: PaymentSetMethodInfoInterfaceAccountAction,
	) {
		resource.paymentMethodInfo.interfaceAccount = interfaceAccount;
	}

	setMethodInfoToken(
		_context: RepositoryContext,
		resource: Writable<Payment>,
		{ token }: PaymentSetMethodInfoTokenAction,
	) {
		resource.paymentMethodInfo.token = token;
	}
}
