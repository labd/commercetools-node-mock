import { RepositoryContext } from '../repositories/abstract'
import { getRepositoryContext } from '../repositories/helpers'

export type GraphQLContext = {
  repositoryContext: RepositoryContext
}

export const createContext = (data: any): GraphQLContext => ({
  repositoryContext: getRepositoryContext(data.req),
})
