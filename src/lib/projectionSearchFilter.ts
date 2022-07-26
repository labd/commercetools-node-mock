/**
 * This module implements the commercetools product projection filter expression.
 */

import { Product, ProductVariant } from '@commercetools/platform-sdk'
import perplex from 'perplex'
import Parser from 'pratt'
import { nestedLookup } from '../helpers'
import { Writable } from '../types'

type MatchFunc = (target: any) => boolean

type ProductFilter = (
  p: Writable<Product>,
  markMatchingVariants: boolean
) => boolean

type Symbol = {
  type: 'Symbol'
  kind: 'int' | 'string' | 'any'
  value: any
}

type MatchExpression = {
  source: string
  type: 'RangeExpression' | 'FilterExpression' | 'TermExpression'
  children?: RangeExpression[] | FilterExpression[]
}

export type RangeExpression = {
  type: 'RangeExpression'
  start?: number
  stop?: number
  match: (obj: any) => boolean
}

type FilterExpression = {
  type: 'FilterExpression'
  match: (obj: any) => boolean
}

/**
 * Returns a function (ProductFilter).
 * NOTE: The filter can alter the resources in-place (FIXME)
 */
export const parseFilterExpression = (
  filter: string,
  staged: boolean
): ProductFilter => {
  const exprFunc = generateMatchFunc(filter)
  const [source] = filter.split(':', 1)

  if (source.startsWith('variants.')) {
    return filterVariants(source, staged, exprFunc)
  }
  return filterProduct(source, exprFunc)
}

const getLexer = (value: string) => {
  return new perplex(value)
    .token('MISSING', /missing(?![-_a-z0-9]+)/i)
    .token('EXISTS', /exists(?![-_a-z0-9]+)/i)
    .token('RANGE', /range(?![-_a-z0-9]+)/i)
    .token('TO', /to(?![-_a-z0-9]+)/i)
    .token('IDENTIFIER', /[-_\.a-z]+/i)

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
}

const parseFilter = (filter: string): MatchExpression => {
  const lexer = getLexer(filter)
  const parser = new Parser(lexer)
    .builder()
    .nud('IDENTIFIER', 100, t => {
      return t.token.match
    })
    .led(':', 100, ({ left, bp }) => {
      let parsed: any = parser.parse({ terminals: [bp - 1] })
      let expressions: RangeExpression[] | FilterExpression[] | Symbol[]
      expressions = !Array.isArray(parsed) ? [parsed] : parsed

      // Make sure we only have one type of expression (cannot mix)
      const unique = new Set(expressions.map(expr => expr.type))
      if (unique.size > 1) {
        throw new Error('Invalid expression')
      }

      // Convert plain symbols to a filter expression. For example
      // variants.attribute.foobar:4 where 4 is a Symbol should result
      // in a comparison
      if (expressions.some(expr => expr.type == 'Symbol')) {
        return {
          source: left as string,
          type: 'FilterExpression',
          children: expressions.map(e => {
            if (e.type != 'Symbol') {
              throw new Error('Invalid expression')
            }

            return {
              type: 'FilterExpression',
              match: (obj: any): boolean => {
                return obj === e.value
              },
            } as FilterExpression
          }),
        } as MatchExpression
      }

      return {
        source: left,
        type: expressions[0].type,
        children: expressions,
      }
    })
    .nud('STRING', 20, t => {
      return {
        type: 'Symbol',
        kind: 'string',
        // @ts-ignore
        value: t.token.groups[1],
      } as Symbol
    })
    .nud('INT', 5, t => {
      return {
        type: 'Symbol',
        kind: 'int',
        value: parseInt(t.token.match, 10),
      } as Symbol
    })
    .nud('STAR', 5, t => {
      return {
        type: 'Symbol',
        kind: 'any',
        value: null,
      }
    })
    .nud('EXISTS', 10, ({ bp }) => {
      return {
        type: 'FilterExpression',
        match: (obj: any): boolean => {
          return obj !== undefined
        },
      } as FilterExpression
    })
    .nud('MISSING', 10, ({ bp }) => {
      return {
        type: 'FilterExpression',
        match: (obj: any): boolean => {
          return obj === undefined
        },
      } as FilterExpression
    })
    .led('COMMA', 200, ({ left, token, bp }) => {
      const expr: any = parser.parse({ terminals: [bp - 1] })
      if (Array.isArray(expr)) {
        return [left, ...expr]
      } else {
        return [left, expr]
      }
    })
    .nud('(', 100, t => {
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
        let func = undefined

        if (range.start !== null && range.stop !== null) {
          func = (obj: any): boolean => {
            return obj >= range.start && obj <= range.stop
          }
        } else if (range.start === null && range.stop !== null) {
          func = (obj: any): boolean => {
            return obj <= range.stop
          }
        } else if (range.start !== null && range.stop === null) {
          func = (obj: any): boolean => {
            return obj >= range.start
          }
        } else {
          func = (obj: any): boolean => {
            return true
          }
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
  if (!result?.children) {
    const lines = filter.split('\n')
    const column = lines[lines.length - 1].length
    throw new Error(`Syntax error while parsing '${filter}'.`)
  }
  return (obj: any) => {
    if (!result.children) return false
    return result.children.some(c => c.match(obj))
  }
}

export const generateFacetFunc = (filter: string): MatchExpression => {
  if (!filter.includes(':')) {
    return {
      source: filter,
      type: 'TermExpression',
    }
  }
  return parseFilter(filter)
}

const filterProduct = (source: string, exprFunc: MatchFunc): ProductFilter => {
  return (p: Product, markMatchingVariants: boolean): boolean => {
    const value = nestedLookup(p, source)
    return exprFunc(value)
  }
}

const filterVariants = (
  source: string,
  staged: boolean,
  exprFunc: MatchFunc
): ProductFilter => {
  return (p: Product, markMatchingVariants: boolean): boolean => {
    const [, ...paths] = source.split('.')
    const path = paths.join('.')

    const variants = getVariants(p, staged) as Writable<ProductVariant>[]
    for (const variant of variants) {
      const value = resolveVariantValue(variant, path)

      if (exprFunc(value)) {
        // If markMatchingVariants parameter is true those ProductVariants that
        // match the search query have the additional field isMatchingVariant
        // set to true. For the other variants in the same product projection
        // this field is set to false.
        if (markMatchingVariants) {
          variants.forEach(v => (v.isMatchingVariant = false))
          variant.isMatchingVariant = true
        }
        return true
      }
    }

    return false
  }
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

export const getVariants = (p: Product, staged: boolean): ProductVariant[] => {
  return [
    staged
      ? p.masterData.staged?.masterVariant
      : p.masterData.current?.masterVariant,
    ...(staged
      ? p.masterData.staged?.variants
      : p.masterData.current?.variants),
  ]
}
