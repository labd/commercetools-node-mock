import {
  Review,
  ReviewDraft,
  ReviewUpdateAction,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class ReviewRepository extends AbstractResourceRepository<'review'> {
  getTypeId() {
    return 'review' as const
  }

  create(context: RepositoryContext, draft: ReviewDraft): Review {
    const resource: Review = {
      ...getBaseResourceProperties(),
      includedInStatistics: false,
    }
    this.saveNew(context, resource)
    return resource
  }

  actions: Partial<
    Record<
      ReviewUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<Review>,
        action: any
      ) => void
    >
  > = {}
}
