/**
 * Prettier 会把 Vue 模板里的 `as` 断言当成「整个表达式」，去掉外面的括号。
 * 绑定写成 `:icon="citem.icon as SvgName"` 不好读，也和 TS 模板习惯不一致。
 * 这里在解析后给 `as` / `satisfies` / `<T>x` 包一层 ParenthesizedExpression，保存时就会留下括号。
 */
import * as babel from 'prettier/plugins/babel'

const skipKeys = new Set([
	'loc',
	'range',
	'start',
	'end',
	'errors',
	'comments',
	'tokens',
])

const asTypes = new Set([
	'TSAsExpression',
	'TSTypeAssertion',
	'TSSatisfiesExpression',
])

function wrapTsAs(node, parent) {
	if (!node || typeof node !== 'object') {
		return node
	}
	if (Array.isArray(node)) {
		return node.map((item) => wrapTsAs(item, parent))
	}
	const next = { ...node }
	for (const key of Object.keys(next)) {
		if (skipKeys.has(key)) {
			continue
		}
		const child = next[key]
		if (
			child &&
			typeof child === 'object' &&
			(child.type || Array.isArray(child))
		) {
			next[key] = wrapTsAs(child, next)
		}
	}
	if (asTypes.has(next.type) && parent?.type !== 'ParenthesizedExpression') {
		return { type: 'ParenthesizedExpression', expression: next }
	}
	return next
}

function wrapParser(parser) {
	return {
		...parser,
		parse(text, options) {
			const ast = parser.parse(text, options)
			return wrapTsAs(ast, null)
		},
	}
}

export const parsers = {
	__vue_ts_expression: wrapParser(babel.parsers.__vue_ts_expression),
	__vue_ts_event_binding: wrapParser(babel.parsers.__vue_ts_event_binding),
	__ts_expression: wrapParser(babel.parsers.__ts_expression),
}
