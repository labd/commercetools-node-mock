// From https://github.com/jrop/pratt/blob/master/src/index.ts

export interface IPosition {
	line: number
	column: number
}
export interface ITokenPosition {
	start: IPosition
	end: IPosition
}
export interface IToken<T> {
	type: T
	match: string
	strpos(): ITokenPosition
	isEof(): boolean
}
export interface ILexer<T> {
	next(): IToken<T>
	peek(): IToken<T>
}

export type BPResolver = () => number
export type BP = number | BPResolver

export type StopFunction = (<T>(x: T) => T) & {isStopped(): boolean}

export type NudInfo<T> = {
	token: IToken<T>
	bp: number
	stop: StopFunction

	// TODO: with the below addition of `options`
	// the `ctx parameter is carried through anyway
	// remove in a breaking API change release
	ctx: any
	options: ParseOpts<T>
}
export type LedInfo<T> = NudInfo<T> & {left: any}

export type NudFunction<T> = (inf: NudInfo<T>) => any
export type LedFunction<T> = (inf: LedInfo<T>) => any

export type NudMap<T> = Map<T, NudFunction<T>>
export type LedMap<T> = Map<T, LedFunction<T>>

export type ParseOpts<T> = {
	ctx?: any
	stop?: StopFunction
	terminals?: (number | T)[]
}

const createStop = <T>(): StopFunction => {
	let stopCalled = false
	return Object.assign(
		(x: T) => {
			stopCalled = true
			return x
		},
		{
			isStopped() {
				return stopCalled
			},
		}
	) as StopFunction
}

/**
 * A Pratt parser.
 * @example
 * const lex = new perplex.Lexer('1 + -2 * 3^4')
 *   .token('NUM', /\d+/)
 *   .token('+', /\+/)
 *   .token('-', /-/)
 *   .token('*', new RegExp('*'))
 *   .token('/', /\//)
 *   .token('^', /\^/)
 *   .token('(', /\(/)
 *   .token(')', /\)/)
 *   .token('$SKIP_WS', /\s+/)
 *
 * const parser = new Parser(lex)
 *   .builder()
 *   .nud('NUM', 100, t => parseInt(t.match))
 *   .nud('-', 10, (t, bp) => -parser.parse(bp))
 *   .nud('(', 10, (t, bp) => {
 *     const expr = parser.parse(bp)
 *     lex.expect(')')
 *     return expr
 *   })
 *   .bp(')', 0)
 *
 *   .led('^', 20, (left, t, bp) => Math.pow(left, parser.parse(20 - 1)))
 *   .led('+', 30, (left, t, bp) => left + parser.parse(bp))
 *   .led('-', 30, (left, t, bp) => left - parser.parse(bp))
 *   .led('*', 40, (left, t, bp) => left * parser.parse(bp))
 *   .led('/', 40, (left, t, bp) => left / parser.parse(bp))
 *   .build()
 * parser.parse()
 * // => 161
 */
export class Parser<T> {
	public lexer: ILexer<T>
	_nuds: NudMap<T>
	_leds: LedMap<T>
	_bps: Map<T, BP>

	/**
	 * Constructs a Parser instance
	 * @param {ILexer<T>} lexer The lexer to obtain tokens from
	 */
	constructor(lexer: ILexer<T>) {
		/**
		 * The lexer that this parser is operating on.
		 * @type {ILexer<T>}
		 */
		this.lexer = lexer
		this._nuds = new Map()
		this._leds = new Map()
		this._bps = new Map()
	}

	private _type(tokenOrType: IToken<T> | T): T {
		return tokenOrType && typeof (tokenOrType as IToken<T>).isEof == 'function'
			? (tokenOrType as IToken<T>).type
			: (tokenOrType as T)
	}

	/**
	 * Create a {@link ParserBuilder}
	 * @return {ParserBuilder<T>} Returns the ParserBuilder
	 */
	builder(): ParserBuilder<T> {
		return new ParserBuilder(this)
	}

	/**
	 * Define binding power for a token-type
	 * @param {IToken<T>|T} tokenOrType The token type to define the binding power for
	 * @returns {number} The binding power of the specified token type
	 */
	bp(tokenOrType: IToken<T> | T) {
		if (tokenOrType == null) return Number.NEGATIVE_INFINITY
		if (
			tokenOrType &&
			typeof (tokenOrType as IToken<T>).isEof == 'function' &&
			(tokenOrType as IToken<T>).isEof()
		)
			return Number.NEGATIVE_INFINITY
		const type = this._type(tokenOrType)
		const bp = this._bps.has(type)
			? this._bps.get(type)
			: Number.POSITIVE_INFINITY
		return typeof bp == 'function' ? bp() : bp
	}

	/**
	 * Computes the token's `nud` value and returns it
	 * @param {NudInfo<T>} info The info to compute the `nud` from
	 * @returns {any} The result of invoking the pertinent `nud` operator
	 */
	nud(info: NudInfo<T>) {
		const fn: NudFunction<T> | undefined = this._nuds.get(info.token.type)
		if (!fn) {
			const {start} = info.token.strpos()
			throw new Error(
				`Unexpected token: ${info.token.match} (at ${start.line}:${
					start.column
				})`
			)
		}
		return fn(info)
	}

	/**
	 * Computes a token's `led` value and returns it
	 * @param {LedInfo<T>} info The info to compute the `led` value for
	 * @returns {any} The result of invoking the pertinent `led` operator
	 */
	led(info: LedInfo<T>) {
		let fn = this._leds.get(info.token.type)
		if (!fn) {
			const {start} = info.token.strpos()
			throw new Error(
				`Unexpected token: ${info.token.match} (at ${start.line}:${
					start.column
				})`
			)
		}
		return fn(info)
	}

	/**
	 * Kicks off the Pratt parser, and returns the result
	 * @param {ParseOpts<T>} opts The parse options
	 * @returns {any}
	 */
	parse(opts: ParseOpts<T> = {terminals: [0]}): any {
		const stop = (opts.stop = opts.stop || createStop())
		const check = () => {
			if (stop.isStopped()) return false
			const t = this.lexer.peek()
			const bp = this.bp(t)

      // @ts-ignore
			return opts.terminals.reduce((canContinue, rbpOrType) => {
				if (!canContinue) return false
      // @ts-ignore
				if (typeof rbpOrType == 'number') return rbpOrType < bp
				if (typeof rbpOrType == 'string') return t.type != rbpOrType
			}, true)
		}
		const mkinfo = (token: IToken<T>): NudInfo<T> => {
			const bp = this.bp(token)
      // @ts-ignore
			return {token, bp, stop, ctx: opts.ctx, options: opts}
		}
		if (!opts.terminals) opts.terminals = [0]
		if (opts.terminals.length == 0) opts.terminals.push(0)

		let left = this.nud(mkinfo(this.lexer.next()))
		while (check()) {
			const operator = this.lexer.next()
			left = this.led(Object.assign(mkinfo(operator), {left}))
		}
		return left
	}
}

/**
 * Builds `led`/`nud` rules for a {@link Parser}
 */
export class ParserBuilder<T> {
	private _parser: Parser<T>

	/**
	 * Constructs a ParserBuilder
	 * See also: {@link Parser.builder}
	 * @param {Parser<T>} parser The parser
	 */
	constructor(parser: Parser<T>) {
		this._parser = parser
	}

	/**
	 * Define `nud` for a token type
	 * @param {T} tokenType The token type
	 * @param {number} bp The binding power
	 * @param {NudFunction<T>} fn The function that will parse the token
	 * @return {ParserBuilder<T>} Returns this ParserBuilder
	 */
	nud(tokenType: T, bp: BP, fn: NudFunction<T>): ParserBuilder<T> {
		this._parser._nuds.set(tokenType, fn)
		this.bp(tokenType, bp)
		return this
	}

	/**
	 * Define `led` for a token type
	 * @param {T} tokenType The token type
	 * @param {number} bp The binding power
	 * @param {LedFunction<T>} fn The function that will parse the token
	 * @return {ParserBuilder<T>} Returns this ParserBuilder
	 */
	led(tokenType: T, bp: BP, fn: LedFunction<T>): ParserBuilder<T> {
		this._parser._leds.set(tokenType, fn)
		this.bp(tokenType, bp)
		return this
	}

	/**
	 * Define both `led` and `nud` for a token type at once.
	 * The supplied `LedFunction` may be called with a null `left`
	 * parameter when invoked from a `nud` context.
	 * @param {strTng} tokenType The token type
	 * @param {number} bp The binding power
	 * @param {LedFunction<T>} fn The function that will parse the token
	 * @return {ParserBuilder<T>} Returns this ParserBuilder
	 */
	either(tokenType: T, bp: BP, fn: LedFunction<T>): ParserBuilder<T> {
		return this.nud(tokenType, bp, inf =>
			fn(Object.assign(inf, {left: null}))
		).led(tokenType, bp, fn)
	}

	/**
	 * Define the binding power for a token type
	 * @param {T} tokenType The token type
	 * @param {BP} bp The binding power
	 * @return {ParserBuilder<T>} Returns this ParserBuilder
	 */
	bp(tokenType: T, bp: BP): ParserBuilder<T> {
		this._parser._bps.set(tokenType, bp)
		return this
	}

	/**
	 * Returns the parent {@link Parser} instance
	 * @returns {Parser<T>}
	 */
	build(): Parser<T> {
		return this._parser
	}
}

