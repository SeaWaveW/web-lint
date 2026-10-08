import * as cssCalc from './plugins/prettier-css-calc.mjs'
import * as vueAsParens from './plugins/prettier-vue-as-parens.mjs'

/** @type {import('prettier').Config} */
const config = {
	semi: false,
	singleQuote: true,
	useTabs: true,
	tabWidth: 4,
	htmlWhitespaceSensitivity: 'ignore',
	endOfLine: 'auto',
	plugins: [vueAsParens, cssCalc],
}

export default config
