import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

export { default as eslint, defineEslint } from './eslint.config.mjs'
export { default as prettier } from './prettier.config.mjs'
export { default as stylelint, defineStylelint } from './stylelint.config.mjs'
export { default as commitlint } from './commitlint.config.mjs'
export { ignoreGlobs } from './ignores.mjs'

/** 给 `prettier --ignore-path` 用，避免每个项目再抄一份 .prettierignore */
export const prettierIgnorePath = join(root, 'prettierignore')

/** 给 `stylelint --ignore-path` 用；更推荐直接 re-export 本包 stylelint 配置 */
export const stylelintIgnorePath = join(root, 'stylelintignore')
