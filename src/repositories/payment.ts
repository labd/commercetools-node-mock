import {
  Payment,
  PaymentDraft,
  ReferenceTypeId,
  StateReference,
  Transaction,
} from '@commercetools/platform-sdk'
import AbstractRepository from './abstract'
import {
  createCustomFields,
  createTypedMoney,
  getReferenceFromResourceIdentifier,
} from './helpers'
import { getBaseResourceProperties } from '../helpers'
import { v4 as uuidv4 } from 'uuid'

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
        (t): Transaction => ({
          ...t,
          id: uuidv4(),
          amount: createTypedMoney(t.amount),
        })
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

  actions = {
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
    // setCustomField: () => {},
    // setCustomType: () => {},
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
