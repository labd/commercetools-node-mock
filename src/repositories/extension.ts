import type {
  Extension,
  ExtensionChangeDestinationAction,
  ExtensionChangeTriggersAction,
  ExtensionDraft,
  ExtensionSetKeyAction,
  ExtensionSetTimeoutInMsAction,
  ExtensionUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import { maskSecretValue } from '../lib/masking.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, type RepositoryContext } from './abstract.js'

export class ExtensionRepository extends AbstractResourceRepository<'extension'> {
  getTypeId() {
    return 'extension' as const
  }

  postProcessResource(resource: Extension): Extension {
    if (resource) {
      const extension = resource as Extension
      if (
        extension.destination.type === 'HTTP' &&
        extension.destination.authentication?.type === 'AuthorizationHeader'
      ) {
        return maskSecretValue(
          extension,
          'destination.authentication.headerValue'
        )
      } else if (extension.destination.type == 'AWSLambda') {
        return maskSecretValue(resource, 'destination.accessSecret')
      }
    }
    return resource
  }

  create(context: RepositoryContext, draft: ExtensionDraft): Extension {
    const resource: Extension = {
      ...getBaseResourceProperties(),
      key: draft.key,
      timeoutInMs: draft.timeoutInMs,
      destination: draft.destination,
      triggers: draft.triggers,
    }
    this.saveNew(context, resource)
    return resource
  }

  actions: Record<
    ExtensionUpdateAction['action'],
    (
      context: RepositoryContext,
      resource: Writable<Extension>,
      action: any
    ) => void
  > = {
    setKey: (
      context: RepositoryContext,
      resource: Writable<Extension>,
      { key }: ExtensionSetKeyAction
    ) => {
      resource.key = key
    },
    setTimeoutInMs: (
      context: RepositoryContext,
      resource: Writable<Extension>,
      { timeoutInMs }: ExtensionSetTimeoutInMsAction
    ) => {
      resource.timeoutInMs = timeoutInMs
    },
    changeTriggers: (
      context: RepositoryContext,
      resource: Writable<Extension>,
      { triggers }: ExtensionChangeTriggersAction
    ) => {
      resource.triggers = triggers
    },
    changeDestination: (
      context: RepositoryContext,
      resource: Writable<Extension>,
      { destination }: ExtensionChangeDestinationAction
    ) => {
      resource.destination = destination
    },
  }
}
