import {
  InvalidInputError,
  Subscription,
  SubscriptionDraft,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from '../exceptions'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class SubscriptionRepository extends AbstractResourceRepository<'subscription'> {
  getTypeId() {
    return 'subscription' as const
  }
  create(context: RepositoryContext, draft: SubscriptionDraft): Subscription {
    // TODO: We could actually test this here by using the aws sdk. For now
    // hardcode a failed check when account id is 0000000000
    if (draft.destination.type === 'SQS') {
      const queueURL = new URL(draft.destination.queueUrl)
      const accountId = queueURL.pathname.split('/')[1]
      if (accountId === '0000000000') {
        const dest = draft.destination
        throw new CommercetoolsError<InvalidInputError>(
          {
            code: 'InvalidInput',
            message:
              'A test message could not be delivered to this destination: ' +
              `SQS ${dest.queueUrl} in ${dest.region} for ${dest.accessKey}. ` +
              'Please make sure your destination is correctly configured.',
          },
          400
        )
      }
    }

    const resource: Subscription = {
      ...getBaseResourceProperties(),
      changes: draft.changes || [],
      destination: draft.destination,
      format: draft.format || {
        type: 'Platform',
      },
      key: draft.key,
      messages: draft.messages || [],
      status: 'Healthy',
    }
    this.saveNew(context, resource)
    return resource
  }
}
