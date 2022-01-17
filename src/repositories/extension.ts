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
import { AbstractResourceRepository } from './abstract'

export class ExtensionRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'extension'
  }

  create(projectKey: string, draft: ExtensionDraft): Extension {
    const resource: Extension = {
      ...getBaseResourceProperties(),
      key: draft.key,
      timeoutInMs: draft.timeoutInMs,
      destination: draft.destination,
      triggers: draft.triggers,
    }
    this.save(projectKey, resource)
    return resource
  }

  actions: Record<
    ExtensionUpdateAction['action'],
    (projectKey: string, resource: Writable<Extension>, action: any) => void
  > = {
    setKey: (
      projectKey: string,
      resource: Writable<Extension>,
      { key }: ExtensionSetKeyAction
    ) => {
      resource.key = key
    },
    setTimeoutInMs: (
      projectKey: string,
      resource: Writable<Extension>,
      { timeoutInMs }: ExtensionSetTimeoutInMsAction
    ) => {
      resource.timeoutInMs = timeoutInMs
    },
    changeTriggers: (
      projectKey: string,
      resource: Writable<Extension>,
      { triggers }: ExtensionChangeTriggersAction
    ) => {
      resource.triggers = triggers
    },
    changeDestination: (
      projectKey: string,
      resource: Writable<Extension>,
      { destination }: ExtensionChangeDestinationAction
    ) => {
      resource.destination = destination
    },
  }
}
