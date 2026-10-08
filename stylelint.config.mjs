import { createRequire } from 'node:module'
import { ignoreGlobs } from './ignores.mjs'

const require = createRequire(import.meta.url)

/**
 * stylelint 17 只解析 `./`、`../` 和绝对路径。
 * `postcss-html` 这种包名会从 stylelint 自己的目录 import，pnpm 不提升，
 * 编辑器报 Cannot resolve custom syntax module "postcss-html"。
 * 从本文件解析成绝对路径，本地 link 和发包后都能找到。
 */
const postcssHtml = require.resolve('postcss-html')

const rules = {
	'selector-class-pattern': null,
	'custom-property-pattern': null,
	'scss/dollar-variable-pattern': null,
	'scss/at-mixin-pattern': null,
	'scss/load-partial-extension': null,
	'no-empty-source': null,
	'import-notation': null,
	'comment-empty-line-before': null,
	// Prettier 折行时运算符留在行尾、操作数换到下一行（calc 里的 * / + - 都会这样）。
	// recommended-scss 默认开着这两条，保存后会被判错，整段样式爆红。
	'scss/operator-no-newline-after': null,
	'scss/operator-no-newline-before': null,
	'selector-pseudo-class-no-unknown': [
		true,
		{ ignorePseudoClasses: ['deep', 'global', 'slotted'] },
	],
}

/**
 * 生成 Stylelint 配置。请用 re-export，不要 `extends` 本文件：
 * `ignoreFiles` 从 shareable config 继承时会被丢掉。
 * @param {{ ignoreFiles?: string[], rules?: Record<string, unknown> }} [options]
 * @returns {import('stylelint').Config}
 */
export function defineStylelint(options = {}) {
	return {
		extends: [
			'stylelint-config-standard-scss',
			'stylelint-config-recommended-vue/scss',
			'stylelint-config-recess-order',
		],
		ignoreFiles: [...ignoreGlobs, ...(options.ignoreFiles ?? [])],
		rules: {
			...rules,
			...options.rules,
		},
		// 必须写在 overrides 里：recommended-vue 对 *.vue 再 extends 一份 scss 规则，
		// 根上的 customSyntax / operator 关停会被那一层盖掉。
		overrides: [
			{
				files: ['*.vue', '**/*.vue'],
				customSyntax: postcssHtml,
				rules: {
					'scss/operator-no-newline-after': null,
					'scss/operator-no-newline-before': null,
				},
			},
		],
	}
}

export default defineStylelint()
