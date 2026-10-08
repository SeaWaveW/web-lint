import { isAbsolute } from 'node:path'
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

/** 裸包名 postcss-html 从 stylelint 目录 import 会失败，vue 覆盖必须是绝对路径 */
const vueOverride = defineStylelint().overrides?.find(
	(item) => item.customSyntax,
)
if (!vueOverride || !isAbsolute(String(vueOverride.customSyntax))) {
	throw new Error('vue customSyntax must be an absolute path to postcss-html')
}

if (!commitlint.extends?.includes('@commitlint/config-conventional')) {
	throw new Error('commitlint extends missing')
}

if (!ignoreGlobs.length || !prettierIgnorePath.endsWith('prettierignore')) {
	throw new Error('ignore exports invalid')
}

const { format } = await import('prettier')

/** 行宽放不下时从加减断开，乘除留在同一项 */
const longCalc = await format(
	'.a {\n\twidth: calc(100% - var(--task-panel-width) - var(--review-panel-width) - var(--common-gap) * 2);\n}\n',
	{ ...prettier, parser: 'scss' },
)
const expectedLong = `.a {
	width: calc(
		100%
		- var(--task-panel-width)
		- var(--review-panel-width)
		- var(--common-gap) * 2
	);
}
`
if (longCalc !== expectedLong) {
	throw new Error(`calc break mismatch:\n${longCalc}`)
}

/** 放得下的短式不要拆成多行 */
const shortCalc = await format(
	'.a {\n\tfont-size: calc(var(--font-size) - 2px);\n}\n',
	{ ...prettier, parser: 'scss' },
)
if (!shortCalc.includes('font-size: calc(var(--font-size) - 2px);')) {
	throw new Error(`short calc should stay one line:\n${shortCalc}`)
}

/** 乘号后面的负号不是下一项 */
const unaryMul = await format(
	'.a {\n\ttransform: translateY(calc(var(--pad) * -0.5));\n}\n',
	{ ...prettier, parser: 'scss' },
)
if (!unaryMul.includes('calc(var(--pad) * -0.5)')) {
	throw new Error(`unary minus after * should stay attached:\n${unaryMul}`)
}

console.log('web-lint configs ok')
