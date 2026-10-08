/**
 * Prettier 折 `calc()` 时按行宽从 `var()` 内部断开，`* 2` 会掉到下一行。
 * 加减才是一项的边界：一行放不下时从 `+` / `-` 拆开，乘除留在同一项。
 * 放得下的短式（`calc(var(--font-size) - 2px)`）仍保持一行。
 *
 * 内置 postcss 插件同时带 parser 和 printer。Prettier 优先用 parser 所在插件的 printer，
 * 所以这里要把 css/scss/less 的 parser 一并接过来，打印机才会换成这份。
 */
import { builders } from 'prettier/doc'
import * as postcss from 'prettier/plugins/postcss'

const { group, indent, join, line, softline } = builders

const originalPrint = postcss.printers.postcss.print

/** `*` / `/` 后面的 `+` `-` 是一元，不能当成下一项 */
function isBinaryAdd(parts, index) {
	const part = parts[index]
	if (part?.type !== 'value-operator') {
		return false
	}
	if (part.value !== '+' && part.value !== '-') {
		return false
	}
	if (index === 0) {
		return false
	}
	const prev = parts[index - 1]
	return !(
		prev?.type === 'value-operator' &&
		(prev.value === '*' || prev.value === '/')
	)
}

function topLevelParts(node) {
	const paren = node.group
	if (paren?.type !== 'value-paren_group' || !Array.isArray(paren.groups)) {
		return null
	}
	// calc 只有一组；min/max 的逗号不走这里
	if (paren.groups.length !== 1) {
		return null
	}
	const parts = paren.groups[0]?.groups
	if (
		!Array.isArray(parts) ||
		!parts.some((_, index) => isBinaryAdd(parts, index))
	) {
		return null
	}
	return parts
}

/** 从二元 `+` / `-` 切开，运算符跟在下一项开头 */
function termRanges(parts) {
	const ranges = []
	let start = 0
	for (let index = 1; index < parts.length; index++) {
		if (!isBinaryAdd(parts, index)) {
			continue
		}
		ranges.push([start, index])
		start = index
	}
	ranges.push([start, parts.length])
	return ranges
}

function printTerm(path, print, parts, start, end) {
	const docs = []
	for (let index = start; index < end; index++) {
		if (index > start) {
			const prev = parts[index - 1]
			const before = parts[index - 2]
			// `* -1`：负号贴着数字，不要再插空格
			const tightUnary =
				prev?.type === 'value-operator' &&
				(prev.value === '+' || prev.value === '-') &&
				before?.type === 'value-operator' &&
				(before.value === '*' || before.value === '/')
			docs.push(tightUnary ? '' : ' ')
		}
		docs.push(path.call(print, 'group', 'groups', 0, 'groups', index))
	}
	return docs
}

function printCalc(path, print) {
	const node = path.getValue()
	if (node?.type !== 'value-func' || node.value !== 'calc') {
		return null
	}
	const parts = topLevelParts(node)
	if (!parts) {
		return null
	}
	const terms = termRanges(parts).map(([start, end]) =>
		printTerm(path, print, parts, start, end),
	)
	return group([
		'calc(',
		indent([softline, join(line, terms)]),
		softline,
		')',
	])
}

export const printers = {
	postcss: {
		...postcss.printers.postcss,
		print(path, options, print) {
			return printCalc(path, print) ?? originalPrint(path, options, print)
		},
	},
}

export const parsers = postcss.parsers
