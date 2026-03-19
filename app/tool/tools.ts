import { ComponentType } from 'react'
import TimeConverter from './components/TimeConverter'
import WorldClock from './components/WorldClock'
import Base64Image from './components/Base64Image'
import TextDiff from './components/TextDiff'
import ToolPlaceholder from './components/ToolPlaceholder'
import MoonDiceGame from './components/MoonDiceGame'
import RepoWatchTool from './components/RepoWatchTool'

// 工具类别定义
export type ToolCategory = '日期时间' | '文本处理' | '编码转换' | '开发辅助' | '其他'

// 工具接口定义
export interface Tool {
  id: string
  title: string
  description: string
  component: ComponentType
  category: ToolCategory
  tags: string[]
  icon?: string
  route?: string // 添加路由字段
}

// 所有工具列表
export const tools: Tool[] = [
  {
    id: 'time-converter',
    title: '时间转换器',
    description: '时间戳与日期时间相互转换',
    component: TimeConverter,
    category: '日期时间',
    tags: ['时间戳', '日期', '转换'],
  },
  {
    id: 'world-clock',
    title: '世界时钟',
    description: '查看多个城市的当前时间',
    component: WorldClock,
    category: '日期时间',
    tags: ['时区', '城市', '时间'],
  },
  {
    id: 'text-diff',
    title: '文本对比',
    description: '左右对比两段文本，高亮删除（红）与新增（绿）',
    component: TextDiff,
    category: '文本处理',
    tags: ['文本', '对比', 'diff', '差异'],
  },
  {
    id: 'base64-image',
    title: '图片 Base64',
    description: '拖放文件生成 Base64，或粘贴 Base64 生成图片，可复制',
    component: Base64Image,
    category: '编码转换',
    tags: ['Base64', '图片', '编码', '解码'],
  },
  {
    id: 'repo-watch',
    title: '依赖更新追踪',
    description: '',
    component: RepoWatchTool,
    category: '开发辅助',
    tags: ['GitHub', 'composer', 'package.json', '依赖更新', 'npm', 'packagist'],
  },
  {
    id: 'moon-dice',
    title: '月饼骰子',
    description: '双方轮流摇六颗骰子，按博饼（月饼）规则判定奖项并对比',
    component: MoonDiceGame,
    category: '其他',
    tags: ['游戏', '骰子', '博饼', '月饼'],
  },
]

// 获取工具类别列表
export const getCategories = (): ToolCategory[] => {
  return [...new Set(tools.map(tool => tool.category))] as ToolCategory[]
}

// 根据ID获取工具
export const getToolById = (id: string): Tool | undefined => {
  return tools.find(tool => tool.id === id)
}

// 根据类别获取工具
export const getToolsByCategory = (category: ToolCategory): Tool[] => {
  return tools.filter(tool => tool.category === category)
}

// 搜索工具
export const searchTools = (query: string): Tool[] => {
  const lowerQuery = query.toLowerCase()
  return tools.filter(
    tool =>
      tool.title.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
