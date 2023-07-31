import type {
    BaseResource,
    Project,
    QueryParam,
    ResourceIdentifier
} from '@commercetools/platform-sdk'
import { PagedQueryResponseMap, ResourceMap, ResourceType } from '../types.js'

export type GetParams = {
  expand?: string[]
}

export type QueryParams = {
  expand?: string | string[]
  sort?: string | string[]
  limit?: number
  offset?: number
  withTotal?: boolean
  where?: string | string[]
  [key: string]: QueryParam
}

export abstract class AbstractStorage {
  abstract clear(): void

  abstract all<RT extends ResourceType>(
    projectKey: string,
    typeId: RT
  ): Array<ResourceMap[RT]>

  abstract add<RT extends ResourceType>(
    projectKey: string,
    typeId: RT,
    obj: ResourceMap[RT]
  ): void

  abstract get<RT extends ResourceType>(
    projectKey: string,
    typeId: RT,
    id: string,
    params?: GetParams
  ): ResourceMap[RT] | null

  abstract getByKey<RT extends ResourceType>(
    projectKey: string,
    typeId: RT,
    key: string,
    params: GetParams
  ): ResourceMap[RT] | null

  abstract addProject(projectKey: string): Project
  abstract getProject(projectKey: string): Project
  abstract saveProject(project: Project): Project

  abstract delete<RT extends ResourceType>(
    projectKey: string,
    typeId: RT,
    id: string,
    params: GetParams
  ): ResourceMap[RT] | null

  abstract query<RT extends ResourceType>(
    projectKey: string,
    typeId: RT,
    params: QueryParams
  ): PagedQueryResponseMap[RT]

  abstract getByResourceIdentifier<RT extends ResourceType>(
    projectKey: string,
    identifier: ResourceIdentifier
  ): ResourceMap[RT] | null

  abstract expand<T>(
    projectKey: string,
    obj: T,
    clause: undefined | string | string[]
  ): T
}

export type ProjectStorage = {
  [index in ResourceType]: Map<string, BaseResource>
}
