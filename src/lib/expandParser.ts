/**
 * This module implements the reference expansion as imeplemented by
 * commercetools.
 *
 * See https://docs.commercetools.com/api/general-concepts#reference-expansion
 *
 * TODO: implement support for multi-dimensional array
 */
type ExpandResult = {
	element: string
	index?: string | number
	rest?: string
}

export const parseExpandClause = (clause: string): ExpandResult => {
	const result: ExpandResult = {
		element: clause,
		index: undefined,
		rest: undefined,
	}

	const pos = clause.indexOf('.')
	if (pos > 0) {
		result.element = clause.substring(0, pos)
		result.rest = clause.substring(pos + 1)
	}

	const match = result.element.match(/\[([^\]+])]/)
	if (match) {
		result.index = match[1] === '*' ? '*' : parseInt(match[1], 10)
		result.element = result.element.substring(0, match.index)
	}
	return result
}
