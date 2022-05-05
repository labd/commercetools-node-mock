import {
  Payment,
  PaymentAddTransactionAction,
  PaymentChangeTransactionStateAction,
  PaymentDraft,
  PaymentSetCustomFieldAction,
  PaymentSetCustomTypeAction,
  PaymentTransitionStateAction,
  ReferenceTypeId,
  State,
  StateReference,
  Transaction,
  TransactionDraft,
} from '@commercetools/platform-sdk'
import { AbstractResourceRepository } from './abstract'
import {
  createCustomFields,
  createTypedMoney,
  getReferenceFromResourceIdentifier,
} from './helpers'
import { getBaseResourceProperties } from '../helpers'
import { v4 as uuidv4 } from 'uuid'
import { Writable } from '../types'

export class PaymentRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'payment'
  }

  create(projectKey: string, draft: PaymentDraft): Payment {
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
                  projectKey,
                  this._storage
                )
              : undefined,
          }
        : {},
      transactions: (draft.transactions || []).map(t =>
        this.transactionFromTransactionDraft(t, projectKey)
      ),
      interfaceInteractions: (draft.interfaceInteractions || []).map(
        interaction =>
          createCustomFields(interaction, projectKey, this._storage)!
      ),
      custom: createCustomFields(draft.custom, projectKey, this._storage),
    }

    this.save(projectKey, resource)
    return resource
  }

  transactionFromTransactionDraft = (
    draft: TransactionDraft,
    projectKey: string
  ) => ({
    ...draft,
    id: uuidv4(),
    amount: createTypedMoney(draft.amount),
    custom: createCustomFields(draft.custom, projectKey, this._storage),
  })

  actions = {
    setCustomField: (
      projectKey: string,
      resource: Payment,
      { name, value }: PaymentSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }

      resource.custom.fields[name] = value
    },
    setCustomType: (
      projectKey: string,
      resource: Writable<Payment>,
      { type, fields }: PaymentSetCustomTypeAction
    ) => {
      if (!type) {
        resource.custom = undefined
      } else {
        const resolvedType = this._storage.getByResourceIdentifier(
          projectKey,
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
      projectKey: string,
      resource: Writable<Payment>,
      { transaction }: PaymentAddTransactionAction
    ) => {
      resource.transactions = [
        ...resource.transactions,
        this.transactionFromTransactionDraft(transaction, projectKey),
      ]
    },
    changeTransactionState: (
      _projectKey: string,
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
      projectKey: string,
      resource: Writable<Payment>,
      { state }: PaymentTransitionStateAction
    ) => {
      const stateObj = this._storage.getByResourceIdentifier(
        projectKey,
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
