import path from 'path'
import fs from 'fs'
import { Express } from 'express'
import { createServer } from '@graphql-yoga/node'
import { ProductResolver } from './product'
import { createContext } from './context'
import { Repositories } from '../types'
import { ProductRepository } from '../repositories/product'

export const createGqlRoute = (
  app: Express,
  repositories: Required<Repositories>
) => {
  const server = createServer({
    maskedErrors: false,
    schema: {
      typeDefs: createTypeDefs(),
      resolvers: createResolvers(repositories),
    },
    context: createContext,
  })

  app.use('/:projectKey/graphql', server)
}

const createTypeDefs = () => {
  const filename = path.join(__dirname, 'schema.graphqls')
  return fs.readFileSync(filename, 'utf-8')
}

const createResolvers = (repositories: Required<Repositories>) => {
  const productResolver = new ProductResolver(
    repositories['product'] as ProductRepository
  )

  return {
    Query: {
      ...productResolver.queryResolvers(),
    },
  }
}
