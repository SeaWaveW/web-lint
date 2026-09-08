import * as vueAsParens from './plugins/prettier-vue-as-parens.mjs'

/** @type {import('prettier').Config} */
const config = {
	semi: false,
	singleQuote: true,
	useTabs: true,
	tabWidth: 4,
	htmlWhitespaceSensitivity: 'ignore',
	endOfLine: 'auto',
	plugins: [vueAsParens],
}

export default config
