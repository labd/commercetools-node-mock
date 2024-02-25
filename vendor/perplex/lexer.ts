import LexerState from "./lexer-state";
import Token, { EOF } from "./token";
import TokenTypes from "./token-types";

/**
 * @typedef {{
 *   line: number,
 *   column: number,
 * }} Position
 */

/**
 * Lexes a source-string into tokens.
 *
 * @example
 * const lex = perplex('...')
 *   .token('ID', /my-id-regex/)
 *   .token('(', /\(/)
 *   .token(')', /\)/)
 *   .token('WS', /\s+/, true) // true means 'skip'
 *
 * while ((let t = lex.next()).type != 'EOF') {
 *   console.log(t)
 * }
 * // alternatively:
 * console.log(lex.toArray())
 * // or:
 * console.log(...lex)
 */
class Lexer<T> implements Iterable<Token<T>> {
	/* tslint:disable:variable-name */
	private _state: LexerState<T>;

	private _tokenTypes: TokenTypes<T>;
	/* tslint:enable */

	/**
	 * Creates a new Lexer instance
	 * @param {string} [source = ''] The source string to operate on.
	 */
	constructor(source: string = "") {
		this._state = new LexerState<T>(source);
		this._tokenTypes = new TokenTypes<T>();
	}

	//
	// Getters/Setters
	//

	/**
	 * Gets the current lexer position
	 * @return {number} Returns the position
	 */
	get position() {
		return this._state.position;
	}

	/**
	 * Sets the current lexer position
	 * @param {number} i The position to move to
	 */
	set position(i: number) {
		this._state.position = i;
	}

	/**
	 * Gets the source the lexer is operating on
	 * @return {string} Returns the source
	 */
	get source() {
		return this._state.source;
	}

	/**
	 * Sets the source the lexer is operating on
	 * @param {string} s The source to set
	 */
	set source(s: string) {
		this._state = new LexerState<T>(s);
	}

	//
	// METHODS
	//

	/**
	 * Attaches this lexer to another lexer's state
	 * @param {Lexer<T>} other The other lexer to attach to
	 */
	attachTo(other: Lexer<T>) {
		this._state = other._state;
	}

	/**
	 * Disables a token type
	 * @param {T} type The token type to disable
	 * @return {Lexer<T>}
	 */
	disable(type: T) {
		this._tokenTypes.disable(type);
		return this;
	}

	/**
	 * Enables a token type
	 * @param {T} type The token type to enalbe
	 * @param {?boolean} [enabled=true] Whether to enable/disable the specified token type
	 * @return {Lexer<T>}
	 */
	enable(type: T, enabled?: boolean) {
		this._tokenTypes.enable(type, enabled);
		return this;
	}

	/**
	 * Like {@link next}, but throws an exception if the next token is
	 * not of the required type.
	 * @param {T} type The token type expected from {@link next}
	 * @return {Token<T>} Returns the {@link Token} on success
	 */
	expect(type: T): Token<T> {
		const t = this.next();
		if (t.type != type) {
			const pos = t.strpos();
			throw new Error(
				"Expected " +
					type +
					(t ? ", got " + t.type : "") +
					" at " +
					pos.start.line +
					":" +
					pos.start.column,
			);
		}
		return t;
	}

	/**
	 * Looks up whether a token is enabled.
	 * @param tokenType The token type to look up
	 * @return {boolean} Returns whether the token is enabled
	 */
	isEnabled(tokenType: T) {
		return this._tokenTypes.isEnabled(tokenType);
	}

	/**
	 * Consumes and returns the next {@link Token} in the source string.
	 * If there are no more tokens, it returns a {@link Token} of type `$EOF`
	 * @return {Token<T>}
	 */
	next(): Token<T> {
		try {
			const t = this.peek();
			this._state.position = t.end;
			return t;
		} catch (e) {
			this._state.position = (e as any).end;
			throw e;
		}
	}

	/**
	 * Returns the next {@link Token} in the source string, but does
	 * not consume it.
	 * If there are no more tokens, it returns a {@link Token} of type `$EOF`
	 * @param {number} [position=`this.position`] The position at which to start reading
	 * @return {Token<T>}
	 */
	peek(position: number = this._state.position): Token<T> {
		const read = (i: number = position): Token<T> | null => {
			if (i >= this._state.source.length) return EOF(this);
			const n = this._tokenTypes.peek(this._state.source, i);
			if (!n || !n.result) {
				throw new Error(
					`Unexpected input: ${this._state.source.substring(
						i,
						i + 1,
					)} at (${this.strpos(i).line}:${this.strpos(i).column})`,
				);
			}
			return n
				? n.item.skip
					? read(i + n.result[0].length)
					: new Token(
							n.item.type,
							n.result[0],
							n.result.map((x) => x),
							i,
							i + n.result[0].length,
							this,
						)
				: null;
		};
		const t = read();
		if (t) return t;

		// we did not find a match
		let unexpected = this._state.source.substring(position, position + 1);
		try {
			this.peek(position + 1);
		} catch (e) {
			unexpected += (e as any).unexpected;
		}
		const { line, column } = this.strpos(position);
		const e = new Error(
			`Unexpected input: ${unexpected} at (${line}:${column})`,
		);
		(e as any).unexpected = unexpected;
		(e as any).end = position + unexpected.length;
		throw e;
	}

	/**
	 * Converts a string-index (relative to the source string) to a line and a column.
	 * @param {number} i The index to compute
	 * @return {Position}
	 */
	strpos(i: number): {
		line: number;
		column: number;
	} {
		let lines = this._state.source.substring(0, i).split(/\r?\n/);
		if (!Array.isArray(lines)) lines = [lines];

		const line = lines.length;
		const column = lines[lines.length - 1].length + 1;
		return { line, column };
	}

	/**
	 * Converts the token stream to an array of Tokens
	 * @return {Token<T>[]} The array of tokens (not including (EOF))
	 */
	toArray(): Token<T>[] {
		return [...this];
	}

	/**
	 * Implements the Iterable protocol
	 * Iterates lazily over the entire token stream (not including (EOF))
	 * @return {Iterator<Token<T>>} Returns an iterator over all remaining tokens
	 */
	*[Symbol.iterator]() {
		const oldState = this._state.copy();
		this._state.position = 0;

		let t;
		while (
			!(t = this.next()).isEof() // tslint:disable-line no-conditional-assignment
		)
			yield t;

		this._state = oldState;
	}

	/**
	 * Creates a new token type
	 * @param {T} type The token type
	 * @param {string|RegExp} pattern The pattern to match
	 * @param {?boolean} skip Whether this type of token should be skipped
	 * @return {Lexer<T>}
	 */
	token(type: T, pattern: string | RegExp, skip?: boolean) {
		this._tokenTypes.token(type, pattern, skip);
		return this;
	}

	/**
	 * Creates a keyword
	 * @param kwd The keyword to add as a token
	 */
	keyword(kwd: T) {
		return this.token(kwd, new RegExp(`${kwd}(?=\\W|$)`));
	}

	/**
	 * Creates an operator
	 * @param op The operator to add as a token
	 */
	operator(op: T) {
		const sOp = new String(op).valueOf();
		return this.token(op, sOp);
	}
}

export default Lexer;
export { EOF, Lexer, LexerState, Token, TokenTypes };
