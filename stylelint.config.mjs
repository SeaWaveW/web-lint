import { ignoreGlobs } from './ignores.mjs'

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
	}
}

export default defineStylelint()
