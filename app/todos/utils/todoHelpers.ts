import type { TodoList, TodoTask } from '../types'

const DEFAULT_LIST_NAME = '网站'
const DEFAULT_LIST_DESCRIPTION = '自己开发'
const EMPTY_TASKS: TodoTask[] = []

type TodoListWithTasks = Omit<TodoList, 'tasks'> & { tasks: TodoTask[] }

export type { TodoListWithTasks }

export function sortTasks(tasks: TodoTask[] | undefined): TodoTask[] {
  return [...(tasks ?? EMPTY_TASKS)].sort((a, b) => a.position - b.position)
}

export function normalizeList(list: TodoList): TodoListWithTasks {
  return {
    ...list,
    tasks: sortTasks(list.tasks),
  }
}

export function getDefaultListPayload(): {
  name: string
  description: string
} {
  return {
    name: DEFAULT_LIST_NAME,
    description: DEFAULT_LIST_DESCRIPTION,
  }
}
