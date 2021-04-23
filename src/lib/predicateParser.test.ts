import { matchesPredicate } from './predicateParser'

describe('Predicate filter', () => {
  const object = {
    stringProperty: 'foobar',
    numberProperty: 1234,
    myNestedValue: {
      objectProperty: {
        stringProperty: 'foobar',
      },
    },
  }
  test('string value', async () => {
    expect(matchesPredicate(`stringProperty="foobar"`, object)).toBeTruthy()
  })

  test('lexer confusion', async () => {
    expect(matchesPredicate(`orSomething="foobar"`, object)).toBeFalsy()
    expect(matchesPredicate(`andSomething="foobar"`, object)).toBeFalsy()
  })

  test('invalid predicate', async () => {
    expect(matchesPredicate(`nonExisting=nomatch`, object)).toBeFalsy()
  })

  test('multiple string value', async () => {
    expect(
      matchesPredicate(
        [`stringProperty="foobar"`, `numberProperty=1234`],
        object
      )
    ).toBeTruthy()

    expect(
      matchesPredicate(
        [`stringProperty="foobar"`, `numberProperty=1111`],
        object
      )
    ).toBeFalsy()
  })

  test('number value equals', async () => {
    expect(matchesPredicate(`numberProperty=1234`, object)).toBeTruthy()
    expect(matchesPredicate(`numberProperty = 1234`, object)).toBeTruthy()
  })

  test('and clause', async () => {
    expect(
      matchesPredicate(`numberProperty>1233 and numberProperty<1235`, object)
    ).toBeTruthy()
    expect(
      matchesPredicate(`numberProperty>1233 and numberProperty<1234`, object)
    ).toBeFalsy()
  })

  test('or clause', async () => {
    expect(
      matchesPredicate(
        `numberProperty=1231 or numberProperty>54312 or numberProperty=1234`,
        object
      )
    ).toBeTruthy()
    expect(
      matchesPredicate(`numberProperty=1231 or numberProperty=1234`, object)
    ).toBeTruthy()
    expect(
      matchesPredicate(`numberProperty=1231 or (numberProperty=1234)`, object)
    ).toBeTruthy()
    expect(
      matchesPredicate(
        `numberProperty=1234 and (numberProperty=1230 or (numberProperty=1234 or numberProperty=1235))`,
        object
      )
    ).toBeTruthy()
    expect(
      matchesPredicate(`numberProperty=1233 or numberProperty=1235`, object)
    ).toBeFalsy()
  })

  test('number value greater then', async () => {
    expect(matchesPredicate(`numberProperty > 1233`, object)).toBeTruthy()
    expect(matchesPredicate(`numberProperty > 1234`, object)).toBeFalsy()
  })

  test('number value lesser then', async () => {
    expect(matchesPredicate(`numberProperty < 1235`, object)).toBeTruthy()
    expect(matchesPredicate(`numberProperty < 1234`, object)).toBeFalsy()
  })

  test('nested string value', async () => {
    expect(
      matchesPredicate(
        `myNestedValue(objectProperty(stringProperty="foobar"))`,
        object
      )
    ).toBeTruthy()
  })
})
