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

/** `#` 和 `{` 必须贴在一起，否则不再是 Sass 插值 */
const interpolation = await format(
	'.a {\n\tmin-height: calc(#{$y-gap} * 2 + var(--tab-item-height));\n\theight: calc(var(--control-height) + #{$gap-size});\n\t$result: calc(#{$result} + #{$adj});\n\twidth: calc(var(--#{$token}) + #{$gap-size});\n}\n',
	{ ...prettier, parser: 'scss' },
)
const interpolationExpected = [
	'calc(#{$y-gap} * 2 + var(--tab-item-height))',
	'calc(var(--control-height) + #{$gap-size})',
	'calc(#{$result} + #{$adj})',
	'calc(var(--#{$token}) + #{$gap-size})',
]
for (const piece of interpolationExpected) {
	if (!interpolation.includes(piece)) {
		throw new Error(`scss interpolation must stay #{ :\n${interpolation}`)
	}
}

/** 放得下的 min 仍保持一行 */
const shortMin = await format(
	'.a {\n\twidth: calc(min(1px, 2px) + 3px);\n}\n',
	{ ...prettier, parser: 'scss' },
)
if (!shortMin.includes('width: calc(min(1px, 2px) + 3px);')) {
	throw new Error(`short min calc should stay one line:\n${shortMin}`)
}

/** calc 折行后，min 的参数和括号里的减号各自一行 */
const nestedMin = await format(
	'.a {\n\twidth: calc(#{$tab-height} * min(var(--agent-rows), var(--agent-max-rows)) + #{$tab-gap} * (min(var(--agent-rows), var(--agent-max-rows)) - 1));\n}\n',
	{ ...prettier, parser: 'scss' },
)
const expectedNested = `.a {
	width: calc(
		#{$tab-height} * min(
			var(--agent-rows),
			var(--agent-max-rows)
		)
		+ #{$tab-gap} * (
			min(
				var(--agent-rows),
				var(--agent-max-rows)
			)
			- 1
		)
	);
}
`
if (nestedMin !== expectedNested) {
	throw new Error(`nested min calc mismatch:\n${nestedMin}`)
}

/** 已经被拆开的 `# { $var }` 再格式化要粘回去 */
const brokenInterpolation = await format(
	'.a {\n\tmin-height: calc(# { $y-gap } * 2 + var(--tab-item-height));\n}\n',
	{ ...prettier, parser: 'scss' },
)
if (
	!brokenInterpolation.includes(
		'calc(#{$y-gap} * 2 + var(--tab-item-height))',
	)
) {
	throw new Error(
		`spaced interpolation should glue back:\n${brokenInterpolation}`,
	)
}

console.log('web-lint configs ok')
