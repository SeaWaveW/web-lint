import js from '@eslint/js'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import { ignoreGlobs } from './ignores.mjs'

const rules = {
	'no-var': 'error',
	'no-undef': 'off',
	'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
	'@typescript-eslint/no-explicit-any': 'off',
	'@typescript-eslint/explicit-module-boundary-types': 'off',
	'@typescript-eslint/no-unused-vars': 'off',
	'@typescript-eslint/no-non-null-assertion': 'off',
	'@typescript-eslint/no-empty-object-type': 'off',
	'vue/max-attributes-per-line': 'off',
	'vue/multi-word-component-names': 'off',
	'vue/html-self-closing': 'off',
	'vue/singleline-html-element-content-newline': 'off',
	'vue/multiline-html-element-content-newline': 'off',
	'vue/component-name-in-template-casing': [
		'error',
		'PascalCase',
		{ registeredComponentsOnly: false, ignores: [] },
	],
}

/**
 * 生成 flat config。业务项目可补 ignores / rules，或用 overrides 追加整段配置。
 * @param {{ ignores?: string[], rules?: Record<string, unknown>, overrides?: import('typescript-eslint').ConfigArray }} [options]
 */
export function defineEslint(options = {}) {
	return tseslint.config(
		{
			ignores: [...ignoreGlobs, ...(options.ignores ?? [])],
		},
		js.configs.recommended,
		...tseslint.configs.recommended,
		...pluginVue.configs['flat/recommended'],
		{
			languageOptions: {
				globals: {
					...globals.browser,
					...globals.node,
				},
				parserOptions: {
					parser: tseslint.parser,
					extraFileExtensions: ['.vue'],
					sourceType: 'module',
				},
			},
			rules: {
				...rules,
				...options.rules,
			},
		},
		skipFormatting,
		...(options.overrides ?? []),
	)
}

export default defineEslint()
