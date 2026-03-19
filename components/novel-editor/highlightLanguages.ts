/**
 * 代码高亮语言注册配置
 * 集中管理 highlight.js 的语言注册
 */

import hljs from 'highlight.js/lib/core'

import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'

/**
 * 注册所有支持的编程语言
 */
export function registerHighlightLanguages(): void {
  // Web 相关
  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('js', javascript)
  hljs.registerLanguage('typescript', typescript)
  hljs.registerLanguage('ts', typescript)
  hljs.registerLanguage('css', css)
  hljs.registerLanguage('html', xml)
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('json', json)

  // 脚本语言
  hljs.registerLanguage('bash', bash)
  hljs.registerLanguage('shell', bash)
  hljs.registerLanguage('python', python)
  hljs.registerLanguage('py', python)
  hljs.registerLanguage('ruby', ruby)
  hljs.registerLanguage('php', php)

  // 数据库
  hljs.registerLanguage('sql', sql)

  // 系统编程
  hljs.registerLanguage('go', go)
  hljs.registerLanguage('rust', rust)
  hljs.registerLanguage('java', java)
  hljs.registerLanguage('cpp', cpp)
  hljs.registerLanguage('c++', cpp)
  hljs.registerLanguage('csharp', csharp)
  hljs.registerLanguage('c#', csharp)
  hljs.registerLanguage('swift', swift)
  hljs.registerLanguage('kotlin', kotlin)

  // 配置和数据格式
  hljs.registerLanguage('yaml', yaml)
  hljs.registerLanguage('yml', yaml)
  hljs.registerLanguage('markdown', markdown)
  hljs.registerLanguage('md', markdown)
}

/**
 * 已注册的语言别名映射
 */
export const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown',
  'c++': 'cpp',
  'c#': 'csharp',
}

export { hljs }
