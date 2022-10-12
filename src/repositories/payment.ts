import {
  Payment,
  PaymentAddTransactionAction,
  PaymentChangeTransactionStateAction,
  PaymentDraft,
  PaymentSetCustomFieldAction,
  PaymentSetCustomTypeAction,
  PaymentTransitionStateAction,
  State,
  StateReference,
  Transaction,
  TransactionDraft,
} from '@commercetools/platform-sdk'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import {
  createCustomFields,
  createTypedMoney,
  getReferenceFromResourceIdentifier,
} from './helpers'
import { getBaseResourceProperties } from '../helpers'
import { v4 as uuidv4 } from 'uuid'
import { Writable } from '../types'

export class PaymentRepository extends AbstractResourceRepository<'payment'> {
  getTypeId()  {
    return 'payment' as const
  }

  create(context: RepositoryContext, draft: PaymentDraft): Payment {
    const resource: Payment = {
      ...getBaseResourceProperties(),
      amountPlanned: createTypedMoney(draft.amountPlanned),
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
  ) => ({
    ...draft,
    id: uuidv4(),
    amount: createTypedMoney(draft.amount),
    custom: createCustomFields(draft.custom, context.projectKey, this._storage),
  })

  actions = {
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
          fields: fields || [],
        }
      }
    },
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
    // addInterfaceInteraction: () => {},
    // changeAmountPlanned: () => {},
    // changeTransactionInteractionId: () => {},
    // changeTransactionTimestamp: () => {},
    // setAmountPaid: () => {},
    // setAmountRefunded: () => {},
    // setAnonymousId: () => {},
    // setAuthorization: () => {},
    // setCustomer: () => {},
    // setExternalId: () => {},
    // setInterfaceId: () => {},
    // setKey: () => {},
    // setMethodInfoInterface: () => {},
    // setMethodInfoMethod: () => {},
    // setMethodInfoName: () => {},
    // setStatusInterfaceCode: () => {},
    // setStatusInterfaceText: () => {},
  }
}
