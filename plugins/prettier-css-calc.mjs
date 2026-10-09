/**
 * Prettier 折 `calc()` 时按行宽从 `var()` 内部断开，`* 2` 会掉到下一行。
 * 加减才是一项的边界：一行放不下时从 `+` / `-` 拆开，乘除留在同一项。
 * 放得下的短式（`calc(var(--font-size) - 2px)`）仍保持一行。
 *
 * 更新说明（1.0.4）：
 * - `#{$var}` 不再印成 `# { $var }`。插值在语法树里是 `#` `{` `$var` `}`，中间加空格就不再是 Sass 插值。
 * - `calc` 已经折行时，`min` / `max` / `clamp` 的每个参数单独一行，括号里的 `+` / `-` 也各占一行。
 * - 一行放得下的短式仍保持一行，包括 `calc(min(1px, 2px) + 3px)`。
 *
 * 内置 postcss 插件同时带 parser 和 printer。Prettier 优先用 parser 所在插件的 printer，
 * 所以这里要把 css/scss/less 的 parser 一并接过来，打印机才会换成这份。
 */
import { builders } from 'prettier/doc'
import * as postcss from 'prettier/plugins/postcss'

const { group, ifBreak, indent, join, line, softline } = builders

const originalPrint = postcss.printers.postcss.print

/** 正在打印会折行的 calc。内层 ifBreak 要跟着这一层，而不是普通声明 */
let calcDepth = 0

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

/** 括号里只有一组、且含二元加减时，才能按项折行。min/max 的逗号不在这里 */
function binaryParts(paren) {
	if (paren?.type !== 'value-paren_group' || !Array.isArray(paren.groups)) {
		return null
	}
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

function printTerm(printPart, parts, start, end) {
	const docs = []
	for (let index = start; index < end; index++) {
		if (index > start) {
			const prev = parts[index - 1]
			const current = parts[index]
			const before = parts[index - 2]
			// `* -1`：负号贴着数字，不要再插空格
			const tightUnary =
				prev?.type === 'value-operator' &&
				(prev.value === '+' || prev.value === '-') &&
				before?.type === 'value-operator' &&
				(before.value === '*' || before.value === '/')
			// `#{$var}` 被拆成 `#` `{` `$var` `}`。中间再加空格就不再是 Sass 插值
			const scssInterpolation =
				(prev?.type === 'value-word' &&
					(prev.value === '#' || prev.value === '{')) ||
				(current?.type === 'value-word' && current.value === '}')
			docs.push(tightUnary || scssInterpolation ? '' : ' ')
		}
		docs.push(printPart(index))
	}
	return docs
}

/** 外层 calc 已折行时，多参函数每个参数单独一行 */
function printBrokenCall(path, print, node) {
	const args = node.group?.groups
	if (!Array.isArray(args) || args.length < 2) {
		return null
	}
	// 用 line 不用 hardline：hardline 会强制父级 calc 折行，短式也被拆开
	return [
		node.value,
		'(',
		indent([
			line,
			join(
				[',', line],
				args.map((_, index) =>
					path.call(print, 'group', 'groups', index),
				),
			),
		]),
		line,
		')',
	]
}

/** 外层 calc 已折行时，括号里的加减跟 calc 一样各占一行 */
function printBrokenParen(path, print, parts) {
	const terms = termRanges(parts).map(([start, end]) =>
		printTerm(
			(index) => path.call(print, 'groups', 0, 'groups', index),
			parts,
			start,
			end,
		),
	)
	return ['(', indent([line, join(line, terms)]), line, ')']
}

function printCalc(path, print) {
	const node = path.getValue()
	if (node?.type !== 'value-func' || node.value !== 'calc') {
		return null
	}
	const parts = binaryParts(node.group)
	if (!parts) {
		return null
	}
	// 子节点打印时能知道自己在 calc 里，从而用 ifBreak 跟着折行
	calcDepth++
	try {
		const terms = termRanges(parts).map(([start, end]) =>
			printTerm(
				(index) =>
					path.call(print, 'group', 'groups', 0, 'groups', index),
				parts,
				start,
				end,
			),
		)
		return group([
			'calc(',
			indent([softline, join(line, terms)]),
			softline,
			')',
		])
	} finally {
		calcDepth--
	}
}

export const printers = {
	postcss: {
		...postcss.printers.postcss,
		print(path, options, print) {
			const calcDoc = printCalc(path, print)
			if (calcDoc) {
				return calcDoc
			}
			if (calcDepth > 0) {
				const node = path.getValue()
				const parts =
					node?.type === 'value-paren_group'
						? binaryParts(node)
						: null
				const broken =
					node?.type === 'value-func'
						? printBrokenCall(path, print, node)
						: parts
							? printBrokenParen(path, print, parts)
							: null
				// 单参函数、没有加减的括号仍走原来的打印
				if (broken) {
					return ifBreak(broken, originalPrint(path, options, print))
				}
			}
			return originalPrint(path, options, print)
		},
	},
}

export const parsers = postcss.parsers
