/**
 * This module implements the commercetools product projection filter expression.
 */

import type { ProductProjection, ProductVariant } from '@commercetools/platform-sdk'
import { nestedLookup } from '../helpers.js'
import type { Writable } from '../types.js'
import { Lexer, Parser } from './parser.js'

type MatchFunc = (target: any) => boolean

type ProductProjectionFilter = (
  p: Writable<ProductProjection>,
  markMatchingVariants: boolean
) => boolean

type TypeSymbol = {
  type: 'Symbol'
  kind: 'int' | 'string' | 'any'
  value: any
}

type RangeExpressionSet = {
  source: string
  type: 'RangeExpression'
  children?: RangeExpression[]
}

type FilterExpressionSet = {
  source: string
  type: 'FilterExpression'
  children?: FilterExpression[]
}

type TermExpressionSet = {
  source: string
  type: 'TermExpression'
}

type ExpressionSet =
  | RangeExpressionSet
  | FilterExpressionSet
  | TermExpressionSet

export type RangeExpression = {
  type: 'RangeExpression'
  start?: number
  stop?: number
  match: (obj: any) => boolean
}

export type FilterExpression = {
  type: 'FilterExpression'
  match: (obj: any) => boolean
}

/**
 * Returns a function (ProductProjectionFilter).
 * NOTE: The filter can alter the resources in-place (FIXME)
 */
export const parseFilterExpression = (
  filter: string
): ProductProjectionFilter => {
  const exprFunc = generateMatchFunc(filter)
  const [source] = filter.split(':', 1)

  if (source.startsWith('variants.')) {
    return filterVariants(source, exprFunc)
  }
  return filterProduct(source, exprFunc)
}

const getLexer = (value: string) =>
  new Lexer(value)
    .token('MISSING', /missing(?![-_a-z0-9]+)/i)
    .token('EXISTS', /exists(?![-_a-z0-9]+)/i)
    .token('RANGE', /range(?![-_a-z0-9]+)/i)
    .token('TO', /to(?![-_a-z0-9]+)/i)
    .token('IDENTIFIER', /[-_.a-z]+/i)

    .token('FLOAT', /\d+\.\d+/)
    .token('INT', /\d+/)
    .token('STRING', /"((?:\\.|[^"\\])*)"/)
    .token('STRING', /'((?:\\.|[^'\\])*)'/)

    .token('COMMA', ',')
    .token('STAR', '*')
    .token('(', '(')
    .token(':', ':')
    .token(')', ')')
    .token('"', '"')
    .token('WS', /\s+/, true) // skip

const parseFilter = (filter: string): ExpressionSet => {
  const lexer = getLexer(filter)
  const parser = new Parser(lexer)
    .builder()
    .nud('IDENTIFIER', 100, (t) => t.token.match)
    .led(':', 100, ({ left, bp }) => {
      const parsed: any = parser.parse({ terminals: [bp - 1] })
      const expressions: RangeExpression[] | FilterExpression[] | TypeSymbol[] =
        !Array.isArray(parsed) ? [parsed] : parsed

      // Make sure we only have one type of expression (cannot mix)
      const unique = new Set(expressions.map((expr) => expr.type))
      if (unique.size > 1) {
        throw new Error('Invalid expression')
      }

      // Convert plain symbols to a filter expression. For example
      // variants.attribute.foobar:4 where 4 is a Symbol should result
      // in a comparison
      if (expressions.some((expr) => expr.type == 'Symbol')) {
        return {
          source: left as string,
          type: 'FilterExpression',
          children: expressions.map((e): FilterExpression => {
            if (e.type != 'Symbol') {
              throw new Error('Invalid expression')
            }

            return {
              type: 'FilterExpression',
              match: (obj: any): boolean => obj === e.value,
            }
          }),
        }
      }

      return {
        source: left,
        type: expressions[0].type,
        children: expressions,
      }
    })
    .nud(
      'STRING',
      20,
      (t) =>
        ({
          type: 'Symbol',
          kind: 'string',
          // @ts-ignore
          value: t.token.groups[1],
        } as TypeSymbol)
    )
    .nud(
      'INT',
      5,
      (t) =>
        ({
          type: 'Symbol',
          kind: 'int',
          value: parseInt(t.token.match, 10),
        } as TypeSymbol)
    )
    .nud('STAR', 5, (_) => ({
      type: 'Symbol',
      kind: 'any',
      value: null,
    }))
    .nud(
      'EXISTS',
      10,
      ({ bp }) =>
        ({
          type: 'FilterExpression',
          match: (obj: any): boolean => obj !== undefined,
        } as FilterExpression)
    )
    .nud(
      'MISSING',
      10,
      ({ bp }) =>
        ({
          type: 'FilterExpression',
          match: (obj: any): boolean => obj === undefined,
        } as FilterExpression)
    )
    .led('COMMA', 200, ({ left, token, bp }) => {
      const expr: any = parser.parse({ terminals: [bp - 1] })
      if (Array.isArray(expr)) {
        return [left, ...expr]
      } else {
        return [left, expr]
      }
    })
    .nud('(', 100, (t) => {
      const expr: any = parser.parse({ terminals: [')'] })
      lexer.expect(')')
      return expr
    })
    .bp(')', 0)
    .led('TO', 20, ({ left, bp }) => {
      const expr: any = parser.parse({ terminals: [bp - 1] })
      return {
        start: left.value,
        stop: expr.value,
      }
    })
    .nud('RANGE', 20, ({ bp }) => {
      let ranges: any = parser.parse()

      // If multiple ranges are defined we receive an array of ranges. So let's
      // make sure we always have an array
      if (!Array.isArray(ranges)) {
        ranges = [ranges]
      }

      // Return a list of functions which matches the ranges. These functions
      // are processed as an OR clause
      return ranges.map((range: any) => {
        let func: (obj: any) => boolean

        if (range.start !== null && range.stop !== null) {
          func = (obj: any): boolean => obj >= range.start && obj <= range.stop
        } else if (range.start === null && range.stop !== null) {
          func = (obj: any): boolean => obj <= range.stop
        } else if (range.start !== null && range.stop === null) {
          func = (obj: any): boolean => obj >= range.start
        } else {
          func = (obj: any): boolean => true
        }

        return {
          type: 'RangeExpression',
          start: range.start,
          stop: range.stop,
          match: func,
        } as RangeExpression
      })
    })
    .build()

  return parser.parse()
}

const generateMatchFunc = (filter: string) => {
  const result = parseFilter(filter)
  if (!result) {
    // const lines = filter.split('\n')
    // const column = lines[lines.length - 1].length
    throw new Error(`Syntax error while parsing '${filter}'.`)
  }
  if (result.type == 'TermExpression') {
    throw new Error(`Syntax error while parsing '${filter}'.`)
  }

  return (obj: any) => {
    if (!result.children) return false
    return result.children.some((c) => c.match(obj))
  }
}

export const generateFacetFunc = (filter: string): ExpressionSet => {
  if (!filter.includes(':')) {
    return {
      source: filter,
      type: 'TermExpression',
    }
  }
  return parseFilter(filter)
}

const filterProduct =
  (source: string, exprFunc: MatchFunc): ProductProjectionFilter =>
  (p: ProductProjection, markMatchingVariants: boolean): boolean => {
    const value = nestedLookup(p, source)
    return exprFunc(value)
  }

const filterVariants =
  (source: string, exprFunc: MatchFunc): ProductProjectionFilter =>
  (p: ProductProjection, markMatchingVariants: boolean): boolean => {
    const [, ...paths] = source.split('.')
    const path = paths.join('.')

    const variants = getVariants(p) as Writable<ProductVariant>[]
    for (const variant of variants) {
      const value = resolveVariantValue(variant, path)

      if (exprFunc(value)) {
        // If markMatchingVariants parameter is true those ProductVariants that
        // match the search query have the additional field isMatchingVariant
        // set to true. For the other variants in the same product projection
        // this field is set to false.
        if (markMatchingVariants) {
          variants.forEach((v) => (v.isMatchingVariant = false))
          variant.isMatchingVariant = true
        }
        return true
      }
    }

    return false
  }

export const resolveVariantValue = (obj: ProductVariant, path: string): any => {
  if (path === undefined) {
    return obj
  }
  if (path.startsWith('variants.')) {
    path = path.substring(path.indexOf('.') + 1)
  }

  if (path.startsWith('attributes.')) {
    const [, attrName, ...rest] = path.split('.')
    if (!obj.attributes) {
      return undefined
    }

    for (const attr of obj.attributes) {
      if (attr.name === attrName) {
        return nestedLookup(attr.value, rest.join('.'))
      }
    }
  }

  if (path === 'price.centAmount') {
    return obj.prices && obj.prices.length > 0
      ? obj.prices[0].value.centAmount
      : undefined
  }

  return nestedLookup(obj, path)
}

export const getVariants = (p: ProductProjection): ProductVariant[] => [
  p.masterVariant,
  ...(p.variants ?? []),
]
