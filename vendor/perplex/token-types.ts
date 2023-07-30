// Thank you, http://stackoverflow.com/a/6969486
function toRegExp(str: string): RegExp {
	return new RegExp(str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'))
}

function normalize(regex: RegExp | string): RegExp {
	if (typeof regex === 'string') regex = toRegExp(regex)
	if (!regex.source.startsWith('^'))
		return new RegExp(`^${regex.source}`, regex.flags)
	else return regex
}

function first<T, U>(
	arr: T[],
	predicate: (item: T, i: number) => U
): {item: T; result: U} {
	let i = 0
	for (const item of arr) {
		const result = predicate(item, i++)
		if (result) return {item, result}
	}
}

/**
 * @private
 */
export default class TokenTypes<T> {
	public tokenTypes: {
		type: T
		regex: RegExp
		enabled: boolean
		skip: boolean
	}[]

	constructor() {
		this.tokenTypes = []
	}

	disable(type: T): TokenTypes<T> {
		return this.enable(type, false)
	}

	enable(type: T, enabled: boolean = true): TokenTypes<T> {
		this.tokenTypes
			.filter(t => t.type == type)
			.forEach(t => (t.enabled = enabled))
		return this
	}

	isEnabled(type: T) {
		const ttypes = this.tokenTypes.filter(tt => tt.type == type)
		if (ttypes.length == 0)
			throw new Error(`Token of type ${type} does not exists`)
		return ttypes[0].enabled
	}

	peek(source: string, position: number) {
		const s = source.substr(position)
		return first(this.tokenTypes.filter(tt => tt.enabled), tt => {
			tt.regex.lastIndex = 0
			return tt.regex.exec(s)
		})
	}

	token(
		type: T,
		pattern: RegExp | string,
		skip: boolean = false
	): TokenTypes<T> {
		this.tokenTypes.push({
			type,
			regex: normalize(pattern),
			enabled: true,
			skip,
		})
		return this
	}
}
