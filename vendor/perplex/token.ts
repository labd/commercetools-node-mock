import Lexer from './lexer'

/**
 * @typedef {{
 *   start: Position,
 *   end: Position,
 * }} TokenPosition
 */

/**
 * Represents a token instance
 */
class Token<T> {
	type: T
	match: string
	groups: string[]
	start: number
	end: number
	lexer: Lexer<T>

	/* tslint:disable:indent */
	/**
	 * Constructs a token
	 * @param {T} type The token type
	 * @param {string} match The string that the lexer consumed to create this token
	 * @param {string[]} groups Any RegExp groups that accrued during the match
	 * @param {number} start The string position where this match started
	 * @param {number} end The string position where this match ends
	 * @param {Lexer<T>} lexer The parent {@link Lexer}
	 */
	constructor(
		type: T,
		match: string,
		groups: string[],
		start: number,
		end: number,
		lexer: Lexer<T>
	) {
		/* tslint:enable */
		/**
		 * The token type
		 * @type {T}
		 */
		this.type = type

		/**
		 * The string that the lexer consumed to create this token
		 * @type {string}
		 */
		this.match = match

		/**
		 * Any RegExp groups that accrued during the match
		 * @type {string[]}
		 */
		this.groups = groups

		/**
		 * The string position where this match started
		 * @type {number}
		 */
		this.start = start

		/**
		 * The string position where this match ends
		 * @type {number}
		 */
		this.end = end

		/**
		 * The parent {@link Lexer}
		 * @type {Lexer<T>}
		 */
		this.lexer = lexer
	}

	/**
	 * Returns the bounds of this token, each in `{line, column}` format
	 * @return {TokenPosition}
	 */
	strpos() {
		const start = this.lexer.strpos(this.start)
		const end = this.lexer.strpos(this.end)
		return {start, end}
	}

	// tslint:disable-next-line prefer-function-over-method
	isEof() {
		return false
	}
}

export default Token

export class EOFToken<T> extends Token<T> {
	constructor(lexer: Lexer<T>) {
		const end = lexer.source.length
		super(null, '(eof)', [], end, end, lexer)
	}

	// tslint:disable-next-line prefer-function-over-method
	isEof() {
		return true
	}
}

/**
 * @private
 */
export const EOF = (lexer: Lexer<any>) => new EOFToken(lexer)
