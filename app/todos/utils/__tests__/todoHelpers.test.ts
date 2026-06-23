import { describe, it, expect } from 'vitest'
import {
  sortTasks,
  normalizeList,
  getDefaultListPayload,
  type TodoListWithTasks,
} from '../todoHelpers'
import type { TodoList, TodoTask } from '../types'

const makeTask = (overrides: Partial<TodoTask> = {}): TodoTask => ({
  id: 1,
  todo_list_id: 1,
  title: 'Task 1',
  is_completed: false,
  position: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const makeList = (overrides: Partial<TodoList> = {}): TodoList => ({
  id: 1,
  user_id: 1,
  name: 'My List',
  description: 'A test list',
  position: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('sortTasks', () => {
  it('should sort tasks by position ascending', () => {
    const tasks = [
      makeTask({ id: 1, position: 3 }),
      makeTask({ id: 2, position: 1 }),
      makeTask({ id: 3, position: 2 }),
    ]
    const sorted = sortTasks(tasks)
    expect(sorted.map(t => t.id)).toEqual([2, 3, 1])
  })

  it('should return empty array for undefined', () => {
    expect(sortTasks(undefined)).toEqual([])
  })

  it('should return empty array for empty array', () => {
    expect(sortTasks([])).toEqual([])
  })

  it('should not mutate original array', () => {
    const tasks = [makeTask({ id: 1, position: 2 }), makeTask({ id: 2, position: 1 })]
    sortTasks(tasks)
    expect(tasks[0].id).toBe(1) // original order preserved
  })

  it('should handle single task', () => {
    const tasks = [makeTask({ id: 1, position: 5 })]
    const sorted = sortTasks(tasks)
    expect(sorted).toHaveLength(1)
    expect(sorted[0].position).toBe(5)
  })
})

describe('normalizeList', () => {
  it('should sort tasks in the list', () => {
    const list = makeList({
      tasks: [makeTask({ id: 1, position: 2 }), makeTask({ id: 2, position: 1 })],
    })
    const normalized = normalizeList(list)
    expect((normalized as TodoListWithTasks).tasks.map(t => t.id)).toEqual([2, 1])
  })

  it('should handle list without tasks', () => {
    const list = makeList()
    const normalized = normalizeList(list)
    expect((normalized as TodoListWithTasks).tasks).toEqual([])
  })

  it('should preserve list properties', () => {
    const list = makeList({ name: 'Custom', description: 'Desc' })
    const normalized = normalizeList(list)
    expect(normalized.name).toBe('Custom')
    expect(normalized.description).toBe('Desc')
  })
})

describe('getDefaultListPayload', () => {
  it('should return default name and description', () => {
    const payload = getDefaultListPayload()
    expect(payload.name).toBe('网站')
    expect(payload.description).toBe('自己开发')
  })

  it('should return plain object with correct shape', () => {
    const payload = getDefaultListPayload()
    expect(payload).toEqual({ name: '网站', description: '自己开发' })
  })
})
