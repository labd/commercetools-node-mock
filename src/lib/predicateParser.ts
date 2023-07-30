/**
 * This module implements the commercetools query predicate filter expression.
 * Support should be 100% complete.
 *
 * See https://docs.commercetools.com/api/predicates/query
 */
import { haversineDistance } from './haversine'
import { Lexer, Parser, type ITokenPosition } from './parser'

export class PredicateError {
  message: string

  constructor(message: string) {
    this.message = message
  }
}

type MatchFunc = (target: any, variables: VariableMap) => boolean
type VariableMap = {
  [key: string]: any
}

export const matchesPredicate = (
  predicate: string | string[] | undefined,
  target: any,
  variables?: VariableMap
): boolean => {
  if (!predicate) {
    return true
  }

  if (Array.isArray(predicate)) {
    return predicate.every((item) => {
      const func = generateMatchFunc(item)
      return func(target, variables || {})
    })
  } else {
    const func = generateMatchFunc(predicate)
    return func(target, variables || {})
  }
}

export const parseQueryExpression = (
  predicate: string | string[]
): MatchFunc => {
  if (Array.isArray(predicate)) {
    const callbacks = predicate.map((item) => generateMatchFunc(item))
    return (target: any, variables: VariableMap) =>
      callbacks.every((callback) => callback(target, variables))
  } else {
    return generateMatchFunc(predicate)
  }
}

type TypeSymbol = {
  type: 'var' | 'boolean' | 'string' | 'float' | 'int' | 'identifier'
  value: any
  pos?: ITokenPosition
}

const validateSymbol = (val: TypeSymbol) => {
  if (!val.type) {
    throw new PredicateError('Internal error')
  }

  if (val.type === 'identifier') {
    const char = val.value.charAt(0)
    const line = val.pos?.start.line
    const column = val.pos?.start.column

    throw new PredicateError(
      `Invalid input '${char}', expected input parameter or primitive value (line ${line}, column ${column})`
    )
  }
}

const resolveSymbol = (val: TypeSymbol, vars: VariableMap): any => {
  if (val.type === 'var') {
    if (!(val.value in vars)) {
      throw new PredicateError(`Missing parameter value for ${val.value}`)
    }
    return vars[val.value]
  }

  return val.value
}

const resolveValue = (obj: any, val: TypeSymbol): any => {
  if (val.type !== 'identifier') {
    throw new PredicateError('Internal error')
  }

  if (!(val.value in obj)) {
    if (Array.isArray(obj)) {
      return Object.values(obj)
        .filter((v) => val.value in v)
        .map((v) => v[val.value])
    }
    throw new PredicateError(`The field '${val.value}' does not exist.`)
  }

  return obj[val.value]
}

const getLexer = (value: string) =>
  new Lexer(value)

    .token('AND', /and(?![-_a-z0-9]+)/i)
    .token('OR', /or(?![-_a-z0-9]+)/i)
    .token('NOT', /not(?![-_a-z0-9]+)/i)

    .token('WITHIN', /within(?![-_a-z0-9]+)/i)
    .token('IN', /in(?![-_a-z0-9]+)/i)
    .token('MATCHES_IGNORE_CASE', /matches\s+ignore\s+case(?![-_a-z0-9]+)/i)
    .token('CONTAINS', /contains(?![-_a-z0-9]+)/i)
    .token('ALL', /all(?![-_a-z0-9]+)/i)
    .token('ANY', /any(?![-_a-z0-9]+)/i)
    .token('EMPTY', /empty(?![-_a-z0-9]+)/i)
    .token('IS', /is(?![-_a-z0-9]+)/i)
    .token('DEFINED', /defined(?![-_a-z0-9]+)/i)

    .token('FLOAT', /\d+\.\d+/)
    .token('INT', /\d+/)
    .token('VARIABLE', /:([-_A-Za-z0-9]+)/)
    .token('BOOLEAN', /(true|false)/)
    .token('IDENTIFIER', /[-_A-Za-z0-9]+/)
    .token('STRING', /"((?:\\.|[^"\\])*)"/)
    .token('STRING', /'((?:\\.|[^'\\])*)'/)

    .token('COMMA', ',')
    .token('(', '(')
    .token(')', ')')
    .token('>=', '>=')
    .token('<=', '<=')
    .token('>', '>')
    .token('<', '<')
    .token('!=', '!=')
    .token('=', '=')
    .token('"', '"')
    .token('WS', /\s+/, true) // skip

/**
 * This function converts a query expression in to a callable which returns a
 * boolean to indicate if the given object matches or not.
 *
 * This currently parses the predicate each time it is called, but it should be
 * straight-forward to add a query cache (lru-cache)
 */
const generateMatchFunc = (predicate: string): MatchFunc => {
  const lexer = getLexer(predicate)
  const parser = new Parser(lexer)
    .builder()
    .nud(
      'IDENTIFIER',
      100,
      (t) =>
        ({
          type: 'identifier',
          value: t.token.match,
          pos: t.token.strpos(),
        } as TypeSymbol)
    )
    .nud(
      'BOOLEAN',
      1,
      (t) =>
        ({
          type: 'boolean',
          value: t.token.match === 'true' ? true : false,
          pos: t.token.strpos(),
        } as TypeSymbol)
    )
    .nud(
      'VARIABLE',
      100,
      (t) =>
        ({
          type: 'var',
          // @ts-ignore
          value: t.token.groups[1],
          pos: t.token.strpos(),
        } as TypeSymbol)
    )
    .nud(
      'STRING',
      100,
      (t) =>
        ({
          type: 'string',
          // @ts-ignore
          value: t.token.groups[1],
          pos: t.token.strpos(),
        } as TypeSymbol)
    )
    .nud(
      'INT',
      1,
      (t) =>
        ({
          type: 'int',
          value: parseInt(t.token.match, 10),
          pos: t.token.strpos(),
        } as TypeSymbol)
    )
    .nud(
      'FLOAT',
      1,
      (t) =>
        ({
          type: 'float',
          value: parseFloat(t.token.match),
          pos: t.token.strpos(),
        } as TypeSymbol)
    )
    .nud('NOT', 100, ({ bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any) => !expr(obj)
    })
    .nud('EMPTY', 10, ({ bp }) => 'empty')
    .nud('DEFINED', 10, ({ bp }) => 'defined')

    .led('AND', 5, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any) => left(obj) && expr(obj)
    })
    .led('OR', 5, ({ left, token, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any, vars: object) => left(obj, vars) || expr(obj, vars)
    })
    .led('COMMA', 1, ({ left, token, bp }) => {
      const expr: any = parser.parse({ terminals: [bp - 1] })
      if (Array.isArray(expr)) {
        return [left, ...expr]
      } else {
        return [left, expr]
      }
    })
    .nud('(', 100, (t) => {
      const expr: any = parser.parse({ terminals: [')'] })
      return expr
    })
    .led('(', 100, ({ left, bp }) => {
      const expr = parser.parse()
      lexer.expect(')')
      return (obj: any, vars: object) => {
        const value = resolveValue(obj, left)
        if (value) {
          return expr(value)
        }
        return false
      }
    })
    .bp(')', 0)
    .led('=', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      validateSymbol(expr)

      return (obj: any, vars: VariableMap) => {
        const resolvedValue = resolveValue(obj, left)
        const resolvedSymbol = resolveSymbol(expr, vars)
        if (Array.isArray(resolvedValue)) {
          return !!resolvedValue.some((elem) => elem === resolvedSymbol)
        }
        return resolvedValue === resolvedSymbol
      }
    })
    .led('!=', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      validateSymbol(expr)
      return (obj: any, vars: VariableMap) =>
        resolveValue(obj, left) !== resolveSymbol(expr, vars)
    })
    .led('>', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      validateSymbol(expr)

      return (obj: any, vars: object) =>
        resolveValue(obj, left) > resolveSymbol(expr, vars)
    })
    .led('>=', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      validateSymbol(expr)

      return (obj: any, vars: object) =>
        resolveValue(obj, left) >= resolveSymbol(expr, vars)
    })
    .led('<', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      validateSymbol(expr)

      return (obj: any, vars: object) =>
        resolveValue(obj, left) < resolveSymbol(expr, vars)
    })
    .led('<=', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      validateSymbol(expr)

      return (obj: any, vars: object) =>
        resolveValue(obj, left) <= resolveSymbol(expr, vars)
    })
    .led('IS', 20, ({ left, bp }) => {
      let invert = false

      // Peek if this is a `is not` statement
      const next = lexer.peek()
      if (next.type === 'NOT') {
        invert = true
        lexer.next()
      }

      const expr: any = parser.parse({ terminals: [bp - 1] })

      switch (expr) {
        case 'empty': {
          if (!invert) {
            return (obj: any, vars: VariableMap) => {
              const val = resolveValue(obj, left)
              return val.length === 0
            }
          } else {
            return (obj: any, vars: VariableMap) => {
              const val = resolveValue(obj, left)
              return val.length !== 0
            }
          }
        }
        case 'defined': {
          if (!invert) {
            return (obj: any, vars: VariableMap) => {
              const val = resolveValue(obj, left)
              return val !== undefined
            }
          } else {
            return (obj: any, vars: VariableMap) => {
              const val = resolveValue(obj, left)
              return val === undefined
            }
          }
        }
        default: {
          throw new Error('Unexpected')
        }
      }
    })
    .led('IN', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any, vars: object) => {
        let symbols = expr
        if (!Array.isArray(symbols)) {
          symbols = [expr]
        }

        const inValues = symbols.map((item: TypeSymbol) =>
          resolveSymbol(item, vars)
        )
        return inValues.includes(resolveValue(obj, left))
      }
    })
    .led('MATCHES_IGNORE_CASE', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      validateSymbol(expr)

      return (obj: any, vars: VariableMap) => {
        const value = resolveValue(obj, left)
        const other = resolveSymbol(expr, vars)

        if (typeof value != 'string') {
          throw new PredicateError(
            `The field '${left.value}' does not support this expression.`
          )
        }
        return value.toLowerCase() === other.toLowerCase()
      }
    })
    .led('WITHIN', 20, ({ left, bp }) => {
      const type = lexer.next()

      if (type.match !== 'circle') {
        throw new PredicateError(
          `Invalid input '${type.match}', expected circle`
        )
      }

      lexer.expect('(')
      const expr = parser.parse({ terminals: [')'] })

      return (obj: any, vars: object) => {
        const value = resolveValue(obj, left)
        if (!value) return false

        const maxDistance = resolveSymbol(expr[2], vars)
        const distance = haversineDistance(
          {
            longitude: value[0],
            latitude: value[1],
          },
          {
            longitude: resolveSymbol(expr[0], vars),
            latitude: resolveSymbol(expr[1], vars),
          }
        )
        return distance <= maxDistance
      }
    })
    .led('CONTAINS', 20, ({ left, bp }) => {
      const keyword = lexer.next()

      let expr = parser.parse()
      if (!Array.isArray(expr)) {
        expr = [expr]
      }

      return (obj: any, vars: object) => {
        const value = resolveValue(obj, left)

        if (!Array.isArray(value)) {
          throw new PredicateError(
            `The field '${left.value}' does not support this expression.`
          )
        }

        const array = expr.map((item: TypeSymbol) => resolveSymbol(item, vars))
        if (keyword.type === 'ALL') {
          return array.every((item: any) => value.includes(item))
        } else {
          return array.some((item: any) => value.includes(item))
        }
      }
    })

    .build()

  const result = parser.parse()

  if (typeof result !== 'function') {
    const lines = predicate.split('\n')
    const column = lines[lines.length - 1].length

    throw new PredicateError(
      `Unexpected end of input, expected SphereIdentifierChar, comparison ` +
        `operator, not, in, contains, is, within or matches` +
        ` (line ${lines.length}, column ${column})`
    )
  }
  return result
}
