import perplex from 'perplex'
import { Parser } from 'pratt'

type MatchFunc = (target: any) => boolean

export const matchesPredicate = (
  predicate: string | string[] | undefined,
  target: any
): boolean => {
  if (!predicate) {
    return true
  }
  // TODO: the `or` handling is temporary. a complete error-prone hack
  if (Array.isArray(predicate)) {
    return predicate.every(item => {

      const items = item.split(" or ")
      if (items.length > 1) {
        for(let i=0; i < items.length; i++) {
          const func = generateMatchFunc(items[i])
          if (func(target)) {
            return true
          }
        }
        return false
      }

      const func = generateMatchFunc(item)
      return func(target)
    })
  } else {
      const items = predicate.split(" or ")
      if (items.length > 1) {
        for(let i=0; i < items.length; i++) {
          const func = generateMatchFunc(items[i])
          if (func(target)) {
            return true
          }
        }
        return false
      }
    const func = generateMatchFunc(predicate)
    return func(target)
  }
}

const generateMatchFunc = (predicate: string): MatchFunc => {
  const lexer = new perplex(predicate)
    .token('IDENTIFIER', /[-_A-Za-z0-9]+/)
    .token('LITERAL', /"((?:\\.|[^"\\])*)"/)
    .token('LITERAL', /'((?:\\.|[^'\\])*)'/)
    .token('LITERAL', /(\d+)/)
    .token('(', /\(/)
    .token(')', /\)/)
    .token('>', />/)
    .token('<', /</)
    .token('=', /=/)
    .token('"', /"/)
    .token('WS', /\s+/, true) // skip

  const parser = new Parser(lexer)
    .builder()
    .nud('IDENTIFIER', 100, t => {
      return t.token.match
    })
    .nud('LITERAL', 100, t => {
      // @ts-ignore
      return t.token.groups[1]
    })
    .led('(', 10, left => {
      const expr = parser.parse()
      lexer.expect(')')
      return (obj: any) => {
        if (obj[left.left]) {
          return expr(obj[left.left])
        }
        return false
      }
    })
    .led('=', 20, left => {
      const expr = parser.parse()
      return (obj: any) => {
        // eslint-disable-next-line eqeqeq
        return obj[left.left] == expr
      }
    })
    .led('>', 20, left => {
      const expr = parser.parse()
      return (obj: any) => {
        return obj[left.left] > expr
      }
    })
    .led('<', 20, left => {
      const expr = parser.parse()
      return (obj: any) => {
        return obj[left.left] < expr
      }
    })
    .bp(')', 0)
    .build()

  return parser.parse()
}
