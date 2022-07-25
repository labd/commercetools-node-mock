/**
 * This module implements the commercetools product projection filter expression.
 */

import { Product, ProductVariant } from '@commercetools/platform-sdk'
import perplex from 'perplex'
import Parser from 'pratt'
import { Writable } from '../types'

type MatchFunc = (target: any) => boolean

type ProductFilter = (
  p: Writable<Product>,
  markMatchingVariant: boolean
) => boolean

/**
 * Returns a function (ProductFilter).
 * NOTE: The filter can alter the resources in-place (FIXME)
 */
export const parseFilterExpression = (
  filter: string,
  staged: boolean
): ProductFilter => {
  const [source, expression] = filter.split(':', 2)

  const exprFunc = generateMatchFunc(filter)
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

const generateMatchFunc = (filter: string): MatchFunc => {
  const lexer = getLexer(filter)
  const parser = new Parser(lexer)
    .builder()
    .nud('IDENTIFIER', 100, t => {
      return t.token.match
    })
    .led(':', 100, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })

      if (Array.isArray(expr)) {
        return (obj: any): boolean => {
          return expr.includes(obj)
        }
      }
      if (typeof expr === 'function') {
        return (obj: any): boolean => {
          return expr(obj)
        }
      }
      return (obj: any): boolean => {
        return obj === expr
      }
    })
    .nud('STRING', 20, t => {
      // @ts-ignore
      return t.token.groups[1]
    })
    .nud('INT', 5, t => {
      // @ts-ignore
      return parseInt(t.token.match, 10)
    })
    .nud('STAR', 5, t => {
      return null
    })
    .nud('EXISTS', 10, ({ bp }) => {
      return (val: any) => {
        return val !== undefined
      }
    })
    .nud('MISSING', 10, ({ bp }) => {
      return (val: any) => {
        return val === undefined
      }
    })
    .led('COMMA', 200, ({ left, token, bp }) => {
      const expr: any = parser.parse({ terminals: [bp - 1] })
      if (Array.isArray(expr)) {
        return [left, ...expr]
      } else {
        return [left, expr]
      }
    })
    .bp(')', 0)
    .led('TO', 20, ({ left, bp }) => {
      const expr: any = parser.parse({ terminals: [bp - 1] })
      return [left, expr]
    })
    .nud('RANGE', 20, ({ bp }) => {
      lexer.next() // Skip over opening parthensis
      const [start, stop] = parser.parse()
      console.log(start, stop)
      if (start !== null && stop !== null ) {
        return (obj: any): boolean => {
          return obj >= start && obj <= stop
        }
      }
      else if (start === null && stop !== null) {
        return (obj: any): boolean => {
          return obj <= stop
        }
      }
      else if (start !== null && stop === null) {
        return (obj: any): boolean => {
          return obj >= start
        }
      } else {
        return (obj: any): boolean => {
          return true
        }

      }
    })
    .build()

  const result = parser.parse()

  if (typeof result !== 'function') {
    const lines = filter.split('\n')
    const column = lines[lines.length - 1].length
    throw new Error(`Syntax error while parsing '${filter}'.`)
  }
  return result
}

const filterProduct = (
  source: string,
  exprFunc: MatchFunc
): ProductFilter => {
  return (p: Product, markMatchingVariant: boolean): boolean => {
    const value = nestedLookup(p, source)
    return exprFunc(value)
  }
}

const filterVariants = (
  source: string,
  staged: boolean,
  exprFunc: MatchFunc
): ProductFilter => {
  return (p: Product, markMatchingVariant: boolean): boolean => {
    const [, ...paths] = source.split('.')
    const path = paths.join('.')

    const variants = getVariants(p, staged)
    for (const variant of variants) {
      const value = resolveVariantValue(variant, path)

      if (exprFunc(value)) {
        if (markMatchingVariant) {
          // @ts-ignore
          variant.isMatchingVariant = true
        }
        return true
      }
      return false
    }

    return false
  }
}

const resolveVariantValue = (obj: ProductVariant, path: string): any => {
  if (path === undefined) {
    return obj
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

const nestedLookup = (obj: any, path: string): any => {
  if (!path || path === '') {
    return obj
  }

  const parts = path.split('.')
  let val = obj

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (val == undefined) {
      return undefined
    }

    val = val[part]
  }

  return val
}

const getVariants = (p: Product, staged: boolean): ProductVariant[] => {
  return [
    staged
      ? p.masterData.staged?.masterVariant
      : p.masterData.current?.masterVariant,
    ...(staged
      ? p.masterData.staged?.variants
      : p.masterData.current?.variants),
  ]
}
