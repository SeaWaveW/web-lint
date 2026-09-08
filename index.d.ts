export const ignoreGlobs: string[]
export const prettierIgnorePath: string
export const stylelintIgnorePath: string

export const eslint: object[]
export const prettier: Record<string, unknown>
export const stylelint: Record<string, unknown>
export const commitlint: Record<string, unknown>

export function defineEslint(options?: {
	ignores?: string[]
	rules?: Record<string, unknown>
	overrides?: object[]
}): object[]

export function defineStylelint(options?: {
	ignoreFiles?: string[]
	rules?: Record<string, unknown>
}): Record<string, unknown>
