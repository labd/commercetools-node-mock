import {
  Payment,
  PaymentDraft,
  PaymentSetCustomFieldAction,
  PaymentSetCustomTypeAction,
  ReferenceTypeId,
  StateReference,
  TransactionDraft,
} from '@commercetools/platform-sdk'
import AbstractRepository from './abstract'
import {
  createCustomFields,
  createTypedMoney,
  getReferenceFromResourceIdentifier,
} from './helpers'
import { getBaseResourceProperties } from '../helpers'
import { v4 as uuidv4 } from 'uuid'
import { Writable } from '../types'

export class PaymentRepository extends AbstractRepository {
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
      transactions: (draft.transactions || []).map(
        this.transactionFromTransactionDraft
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

  transactionFromTransactionDraft = (draft: TransactionDraft) => ({
    ...draft,
    id: uuidv4(),
    amount: createTypedMoney(draft.amount),
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
    // addInterfaceInteraction: () => {},
    // addTransaction: () => {},
    // changeAmountPlanned: () => {},
    // changeTransactionInteractionId: () => {},
    // changeTransactionState: () => {},
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
    // transitionState: () => {},
  }
}
