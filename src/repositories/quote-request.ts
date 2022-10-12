import {
    QuoteRequest,
    QuoteRequestDraft,
    QuoteRequestUpdateAction,
  } from '@commercetools/platform-sdk'
  import { Writable } from 'types'
  import { AbstractResourceRepository, RepositoryContext } from './abstract'

  export class QuoteRequestRepository extends AbstractResourceRepository<'quote-request'> {
    getTypeId() {
      return 'quote-request' as const
    }

    create(context: RepositoryContext, draft: QuoteRequestDraft): QuoteRequest {
        throw new Error('not implemented')
    }

    actions: Partial<
      Record<
        QuoteRequestUpdateAction['action'],
        (
          context: RepositoryContext,
          resource: Writable<QuoteRequest>,
          action: any
        ) => void
      >
    > = {}
  }
