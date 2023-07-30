import  perplex from 'perplex'

// Work around an issue with ESM and the perplex module. Explicitly re-export
// the .default to make it work.
// See https://github.com/evanw/esbuild/issues/1719
// @ts-ignore
export const Lexer = perplex.default
