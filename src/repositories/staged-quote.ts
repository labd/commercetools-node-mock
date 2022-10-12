import {
    Quote,
    StagedQuote,
    StagedQuoteDraft,
    StagedQuoteUpdateAction,
  } from '@commercetools/platform-sdk'
  import { Writable } from 'types'
  import { AbstractResourceRepository, RepositoryContext } from './abstract'

  export class StagedQuoteRepository extends AbstractResourceRepository<'staged-quote'> {
    getTypeId() {
      return 'staged-quote' as const
    }

    create(context: RepositoryContext, draft: StagedQuoteDraft): StagedQuote {
        throw new Error('not implemented')
    }

    actions: Partial<
      Record<
      StagedQuoteUpdateAction['action'],
        (
          context: RepositoryContext,
          resource: Writable<Quote>,
          action: any
        ) => void
      >
    > = {}
  }
