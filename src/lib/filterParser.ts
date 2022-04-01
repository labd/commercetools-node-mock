export const parseFilterExpression = (filter: string | string[]) => {
  if (typeof filter === 'object') {
    const filters = filter.map(parse)
    return filters.join(' and ')
  }
  return parse(filter)
}

const parse = (filter: string) => {
  let parsed = filter
      .replace(/subtree\("(.*)"\)/, '"$1"')
      .replace(/:/g, '=')

  do {
    parsed = parsed.replace(/(.*)\.(.*)=(.*)$/g, '$1($2=$3)')
  } while (parsed.includes('.'))

  return parsed
}
