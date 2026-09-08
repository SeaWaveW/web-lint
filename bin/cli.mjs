#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const cwdRequire = createRequire(join(process.cwd(), 'package.json'))

const configs = {
	eslint: join(root, 'eslint.config.mjs'),
	prettier: join(root, 'prettier.config.mjs'),
	stylelint: join(root, 'stylelint.config.mjs'),
	commitlint: join(root, 'commitlint.config.mjs'),
}

const ignoreFiles = {
	prettier: join(root, 'prettierignore'),
	stylelint: join(root, 'stylelintignore'),
}

const packages = {
	eslint: { name: 'eslint', bin: 'eslint' },
	prettier: { name: 'prettier', bin: 'prettier' },
	stylelint: { name: 'stylelint', bin: 'stylelint' },
	commitlint: { name: '@commitlint/cli', bin: 'commitlint' },
}

const flagValues = new Set(['--config', '-c', '--ignore-path'])

function hasFlag(args, names) {
	return args.some((arg) =>
		names.some((name) => arg === name || arg.startsWith(`${name}=`)),
	)
}

function hasPositionalInput(args) {
	return args.some((arg, index) => {
		if (arg.startsWith('-')) {
			return false
		}
		return !flagValues.has(args[index - 1])
	})
}

function resolvePkgJson(name) {
	try {
		return require.resolve(`${name}/package.json`)
	} catch {
		return cwdRequire.resolve(`${name}/package.json`)
	}
}

function resolveBin(name, binName) {
	const pkgPath = resolvePkgJson(name)
	const pkg = require(pkgPath)
	const rel = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[binName]
	return join(dirname(pkgPath), rel)
}

function printHelp() {
	console.log(`@saco/web-lint

Usage:
  web-lint eslint [eslint-args]
  web-lint prettier [prettier-args]
  web-lint stylelint [stylelint-args]
  web-lint commitlint [commitlint-args]

未传 --config 时自动带上本包配置；prettier / stylelint 还会带上本包 ignore。
`)
}

const tool = process.argv[2]
const args = process.argv.slice(3)

if (!tool || tool === '-h' || tool === '--help' || !(tool in packages)) {
	printHelp()
	process.exit(tool && !(tool in packages) ? 1 : 0)
}

const forwarded = [...args]

if (!hasFlag(forwarded, ['--config', '-c'])) {
	forwarded.unshift('--config', configs[tool])
}

if (tool in ignoreFiles && !hasFlag(forwarded, ['--ignore-path'])) {
	forwarded.unshift('--ignore-path', ignoreFiles[tool])
}

if (tool === 'stylelint' && !hasPositionalInput(forwarded)) {
	forwarded.push('**/*.{vue,css,scss,less}')
}

const child = spawn(
	process.execPath,
	[resolveBin(packages[tool].name, packages[tool].bin), ...forwarded],
	{
		stdio: 'inherit',
		windowsHide: true,
	},
)

child.on('exit', (code) => {
	process.exit(code ?? 1)
})

child.on('error', (error) => {
	console.error(error)
	process.exit(1)
})
