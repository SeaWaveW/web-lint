import {
	commitlint,
	defineEslint,
	defineStylelint,
	eslint,
	ignoreGlobs,
	prettier,
	prettierIgnorePath,
	stylelint,
} from '../index.mjs'

if (!Array.isArray(eslint) || eslint.length === 0) {
	throw new Error('eslint config is empty')
}

const extra = defineEslint({ ignores: ['tmp/**'], rules: { 'no-var': 'warn' } })
if (!Array.isArray(extra) || extra.length === 0) {
	throw new Error('defineEslint should return flat config')
}

if (!prettier.plugins?.length) {
	throw new Error('prettier plugin missing')
}

if (!stylelint.extends?.length || !defineStylelint().rules) {
	throw new Error('stylelint config invalid')
}

if (!commitlint.extends?.includes('@commitlint/config-conventional')) {
	throw new Error('commitlint extends missing')
}

if (!ignoreGlobs.length || !prettierIgnorePath.endsWith('prettierignore')) {
	throw new Error('ignore exports invalid')
}

console.log('web-lint configs ok')
