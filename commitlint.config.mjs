/** @type {import('@commitlint/types').UserConfig} */
const config = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		// 标题允许中文，不强制英文大小写
		'subject-case': [0],
		'header-max-length': [2, 'always', 100],
		'type-enum': [
			2,
			'always',
			[
				'feat', // 新功能
				'fix', // 缺陷修复
				'docs', // 文档
				'style', // 代码格式（不影响逻辑）
				'refactor', // 重构
				'perf', // 性能
				'test', // 测试
				'build', // 构建 / 依赖
				'ci', // CI 配置
				'chore', // 杂项（工具、仓库杂务）
				'revert', // 回滚
			],
		],
	},
}

export default config
