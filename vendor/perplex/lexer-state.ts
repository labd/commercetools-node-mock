import TokenTypes from './token-types'

/**
 * @private
 */
export default class LexerState<T> {
	public source: string
	public position: number
	public tokenTypes: TokenTypes<T>

	constructor(source: string, position: number = 0) {
		this.source = source
		this.position = position
	}

	copy() {
		return new LexerState<T>(this.source, this.position)
	}
}
