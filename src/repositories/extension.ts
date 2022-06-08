import {
  Extension,
  ExtensionChangeDestinationAction,
  ExtensionChangeTriggersAction,
  ExtensionDraft,
  ExtensionSetKeyAction,
  ExtensionSetTimeoutInMsAction,
  ExtensionUpdateAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from '../types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class ExtensionRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'extension'
  }

  create(context: RepositoryContext, draft: ExtensionDraft): Extension {
    const resource: Extension = {
      ...getBaseResourceProperties(),
      key: draft.key,
      timeoutInMs: draft.timeoutInMs,
      destination: draft.destination,
      triggers: draft.triggers,
    }
    this.save(context, resource)
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
