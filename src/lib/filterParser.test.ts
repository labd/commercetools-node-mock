import { parseFilterExpression } from './filterParser'

describe('filter parser', () => {
  test('parses array', () => {
    expect(
      parseFilterExpression(['variant.sku:"123"', `variant.version="312"`])
    ).toEqual('variant(sku="123") and variant(version="312")')
  })

  test('parses string', () => {
    expect(parseFilterExpression('variant.something.sku:"123"')).toEqual(
      'variant(something(sku="123"))'
    )
  })
})
