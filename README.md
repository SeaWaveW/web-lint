# @saco/web-lint

把各项目里重复的 ESLint / Prettier / Stylelint / Commitlint 配置收成一个包。规则、忽略名单、以及 Vue 模板里保留 `(x as Type)` 括号的 Prettier 插件都在这里。

业务项目不再需要自己维护：

- `.prettierrc.json` / `.prettierignore`
- `.stylelintignore`
- `eslint.config.mjs`
- `stylelint.config.mjs`
- `commitlint.config.mjs`
- `prettier-plugin-vue-as-parens.mjs`

## 安装

```bash
pnpm add -D @saco/web-lint
```

插件（`typescript-eslint`、`stylelint-config-*` 等）随本包安装。ESLint / Prettier 编辑器扩展要从**项目根**解析到对应包，pnpm 隔离依赖时再加直依即可：

```bash
pnpm add -D eslint prettier stylelint
```

## 最小接入（推荐）

Prettier / Stylelint / Commitlint 可以只写在 `package.json` 里，**不用再建配置文件**。

ESLint 9/10 不行：flat config 已去掉 `package.json` 的 `eslintConfig`，编辑器要生效就必须有一个 `eslint.config.*`。

`eslint.config.mjs`（唯一必须留下的文件）：

```js
export { default } from '@saco/web-lint/eslint'
```

`package.json`：

```json
{
	"prettier": "@saco/web-lint/prettier",
	"stylelint": {
		"extends": ["@saco/web-lint/stylelint"]
	},
	"commitlint": {
		"extends": ["@saco/web-lint/commitlint"]
	},
	"scripts": {
		"lint": "eslint . --fix",
		"format": "web-lint prettier --write .",
		"stylelint": "web-lint stylelint --fix"
	}
}
```

`web-lint prettier` / `web-lint stylelint` 会带上本包 ignore（`node_modules`、`dist`、生成的 `.types/*.d.ts` 等）。Stylelint 的 `ignoreFiles` **不会**从 `extends` 继承，所以脚本请走 CLI，不要只靠 `"stylelint": { "extends": "…" }` 扫全仓库。

若还要在项目里改 Stylelint 规则，再加一行 `stylelint.config.mjs`：`export { default } from '@saco/web-lint/stylelint'`（这时才是完整配置，`ignoreFiles` 会生效）。

Commitlint + Husky：

```sh
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
```

## 需要改规则时

```js
// eslint.config.mjs
import { defineEslint } from '@saco/web-lint'

export default defineEslint({
	ignores: ['legacy/**'],
	rules: {
		'vue/multi-word-component-names': 'error',
	},
})
```

```js
// stylelint.config.mjs
import { defineStylelint } from '@saco/web-lint'

export default defineStylelint({
	ignoreFiles: ['legacy/**/*.scss'],
	rules: {
		'no-empty-source': true,
	},
})
```

## 零配置文件（只用 CLI）

不写 `eslint.config.mjs` 时，编辑器扩展找不到配置，只适合 CI / 脚本：

```json
{
	"scripts": {
		"lint": "web-lint eslint . --fix",
		"format": "web-lint prettier --write .",
		"stylelint": "web-lint stylelint --fix"
	}
}
```

`web-lint <tool>` 在未传 `--config` 时自动指向本包配置。

## 导出

| 路径                                           | 用途                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `@saco/web-lint`                               | `eslint` / `prettier` / `stylelint` / `commitlint`、`defineEslint` / `defineStylelint`、ignore 路径 |
| `@saco/web-lint/eslint`                        | ESLint flat config（默认导出）                                                                      |
| `@saco/web-lint/prettier`                      | Prettier 配置（Vue `as` 括号、`calc` 按加减换行）                                                   |
| `@saco/web-lint/stylelint`                     | Stylelint 配置                                                                                      |
| `@saco/web-lint/commitlint`                    | Commitlint 配置                                                                                     |
| `@saco/web-lint/prettier-plugin-vue-as-parens` | 单独引用该 Prettier 插件                                                                            |
| `@saco/web-lint/prettier-plugin-css-calc`      | `calc` 放不下时从 `+` / `-` 换行，乘除留在同一项                                                    |

默认约定与原先业务项目一致：无分号、单引号、Tab 缩进、对象形状用 `interface`、Vue 模板组件名 PascalCase。
