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

  test('removes subtree', () => {
    expect(parseFilterExpression('categories.id:subtree("ff1e045b-458f-4a17-ae32-38a23e1118fa")')).toEqual(
      'categories(id="ff1e045b-458f-4a17-ae32-38a23e1118fa")'
    )
  })
})
