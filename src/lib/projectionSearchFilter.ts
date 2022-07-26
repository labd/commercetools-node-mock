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
  markMatchingVariants: boolean
) => boolean

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
        // An array means that this is an OR clause. So return true
        // if any of the elements in the array match. Special handling is
        // needed if one of the elements is an expression (range for example)
        return (obj: any): boolean => {
          for (const e of expr) {
            if (typeof e === 'function') {
              if (e(obj)) {
                return true
              }
            } else if (e === obj) {
              return true
            }
          }
          return false
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
      lexer.expect('(')
      const [start, stop] = parser.parse()
      lexer.expect(')')
      if (start !== null && stop !== null) {
        return (obj: any): boolean => {
          return obj >= start && obj <= stop
        }
      } else if (start === null && stop !== null) {
        return (obj: any): boolean => {
          return obj <= stop
        }
      } else if (start !== null && stop === null) {
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
