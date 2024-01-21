import type {
	Payment,
	PaymentAddTransactionAction,
	PaymentChangeTransactionStateAction,
	PaymentDraft,
	PaymentSetCustomFieldAction,
	PaymentSetCustomTypeAction,
	PaymentSetInterfaceIdAction,
	PaymentSetKeyAction,
	PaymentSetMethodInfoInterfaceAction,
	PaymentSetMethodInfoMethodAction,
	PaymentSetMethodInfoNameAction,
	PaymentSetStatusInterfaceCodeAction,
	PaymentSetStatusInterfaceTextAction,
	PaymentTransitionStateAction,
	State,
	StateReference,
	Transaction,
	TransactionDraft,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'
import {
	createCentPrecisionMoney,
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from './helpers.js'

export class PaymentRepository extends AbstractResourceRepository<'payment'> {
	getTypeId() {
		return 'payment' as const
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
									this._storage
								)
							: undefined,
					}
				: {},
			transactions: (draft.transactions || []).map((t) =>
				this.transactionFromTransactionDraft(t, context)
			),
			interfaceInteractions: (draft.interfaceInteractions || []).map(
				(interaction) =>
					createCustomFields(interaction, context.projectKey, this._storage)!
			),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage
			),
		}

		this.saveNew(context, resource)
		return resource
	}

	transactionFromTransactionDraft = (
		draft: TransactionDraft,
		context: RepositoryContext
	): Transaction => ({
		...draft,
		id: uuidv4(),
		amount: createCentPrecisionMoney(draft.amount),
		custom: createCustomFields(draft.custom, context.projectKey, this._storage),
		state: draft.state ?? 'Initial', // Documented as default
	})

	actions = {
		addTransaction: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ transaction }: PaymentAddTransactionAction
		) => {
			resource.transactions = [
				...resource.transactions,
				this.transactionFromTransactionDraft(transaction, context),
			]
		},
		changeTransactionState: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ transactionId, state }: PaymentChangeTransactionStateAction
		) => {
			const index = resource.transactions.findIndex(
				(e: Transaction) => e.id === transactionId
			)
			const updatedTransaction: Transaction = {
				...resource.transactions[index],
				state,
			}
			resource.transactions[index] = updatedTransaction
		},
		transitionState: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ state }: PaymentTransitionStateAction
		) => {
			const stateObj = this._storage.getByResourceIdentifier(
				context.projectKey,
				state
			) as State | null

			if (!stateObj) {
				throw new Error(`State ${state} not found`)
			}

			resource.paymentStatus.state = {
				typeId: 'state',
				id: stateObj.id,
				obj: stateObj,
			}
		},
		setCustomField: (
			context: RepositoryContext,
			resource: Payment,
			{ name, value }: PaymentSetCustomFieldAction
		) => {
			if (!resource.custom) {
				throw new Error('Resource has no custom field')
			}

			resource.custom.fields[name] = value
		},
		setCustomType: (
			context: RepositoryContext,
			resource: Writable<Payment>,
			{ type, fields }: PaymentSetCustomTypeAction
		) => {
			if (!type) {
				resource.custom = undefined
			} else {
				const resolvedType = this._storage.getByResourceIdentifier(
					context.projectKey,
					type
				)
				if (!resolvedType) {
					throw new Error(`Type ${type} not found`)
				}

				resource.custom = {
					type: {
						typeId: 'type',
						id: resolvedType.id,
					},
					fields: fields ?? {},
				}
			}
		},
		setKey: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ key }: PaymentSetKeyAction
		) => {
			resource.key = key
		},
		setStatusInterfaceCode: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ interfaceCode }: PaymentSetStatusInterfaceCodeAction
		) => {
			resource.paymentStatus.interfaceCode = interfaceCode
		},
		setStatusInterfaceText: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ interfaceText }: PaymentSetStatusInterfaceTextAction
		) => {
			resource.paymentStatus.interfaceText = interfaceText
		},
		setMethodInfoName: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ name }: PaymentSetMethodInfoNameAction
		) => {
			resource.paymentMethodInfo.name = name
		},
		setMethodInfoMethod: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ method }: PaymentSetMethodInfoMethodAction
		) => {
			resource.paymentMethodInfo.method = method
		},
		setMethodInfoInterface: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			args: PaymentSetMethodInfoInterfaceAction
		) => {
			resource.paymentMethodInfo.paymentInterface = args.interface
		},
		setInterfaceId: (
			_context: RepositoryContext,
			resource: Writable<Payment>,
			{ interfaceId }: PaymentSetInterfaceIdAction
		) => {
			resource.interfaceId = interfaceId
		},
		// addInterfaceInteraction: () => {},
		// changeAmountPlanned: () => {},
		// changeTransactionInteractionId: () => {},
		// changeTransactionTimestamp: () => {},
		// setAnonymousId: () => {},
		// setCustomer: () => {},
	}
}
