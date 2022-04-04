export const parseFilterExpression = (filter: string | string[]) => {
  if (typeof filter === 'object') {
    const filters = filter.map(parse)
    return filters.join(' and ')
  }
  return parse(filter)
}

const parse = (filter: string) => {
  let parsed = filter.replace(/:/g, '=')

  do {
    parsed = parsed.replace(/(.*)\.(.*)=(.*)$/g, '$1($2=$3)')
  } while (parsed.includes('.'))

  parsed = parsed
    // variants(price=exists) => variants(price is defined)
    .replace(/=exists/g, ' is defined')
    // variants(price=missing) => variants(price is not defined)
    .replace(/=missing/g, ' is not defined')
    // category(id=subtree("abc", "def")) => category(id contains any("abc", "def"))
    .replace(/=subtree\("(.*)"\)/, ' contains any ("$1")')
    // variants(attributes(name:"NL","EN")) => variants(attributes(name contains any ("NL","EN")))
    .replace(/=("([\w\s-"]+),([\w\s-,"]+)")/, ' contains any ($1)')

  return parsed
}
