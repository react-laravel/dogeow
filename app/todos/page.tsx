'use client'

import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createTodoList,
  createTodoTask,
  deleteTodoList,
  fetchTodoList,
  fetchTodoLists,
  reorderTodoTasks,
  updateTodoTask,
} from './api'
import type { TodoTask } from './types'
import { TodoItemRow } from './components/TodoItemRow'
import {
  getDefaultListPayload,
  normalizeList,
  sortTasks,
  type TodoListWithTasks,
} from './utils/todoHelpers'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import useAuthStore from '@/stores/authStore'

async function loadTodoLists(): Promise<TodoListWithTasks[]> {
  let nextLists = (await fetchTodoLists()).map(normalizeList)

  if (nextLists.length === 0) {
    const createdList = await createTodoList(getDefaultListPayload())
    nextLists = [normalizeList(await fetchTodoList(String(createdList.id)))]
  }

  if (nextLists.length === 0) {
    throw new Error('初始化待办列表失败')
  }

  return nextLists
}

export default function TodosPage() {
  const { isAuthenticated, loading: authLoading } = useAuthStore()
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSubmittingNewTask, setIsSubmittingNewTask] = useState(false)
  const [isDeletingList, setIsDeletingList] = useState(false)
  const [initiallyCompletedTaskIds, setInitiallyCompletedTaskIds] = useState<Set<number>>(
    () => new Set()
  )

  const swrKey = !authLoading && isAuthenticated ? '/todos' : null
  const {
    data: lists = [],
    error,
    isLoading,
    mutate,
  } = useSWR<TodoListWithTasks[]>(swrKey, loadTodoLists, {
    revalidateOnFocus: false,
  })

  const loadError = error instanceof Error ? error.message : error ? '加载待办失败' : null

  useEffect(() => {
    if (!lists[0]) return
    setInitiallyCompletedTaskIds(
      new Set(lists[0].tasks.filter(task => task.is_completed).map(task => task.id))
    )
  }, [lists[0]?.id])

  const updateCurrentList = useCallback(
    (updater: (prev: TodoListWithTasks) => TodoListWithTasks) => {
      void mutate(
        prev => {
          if (!prev || prev.length === 0) return prev
          return [normalizeList(updater(prev[0])), ...prev.slice(1)]
        },
        { revalidate: false }
      )
    },
    [mutate]
  )

  const reloadLists = useCallback(async () => {
    await mutate()
  }, [mutate])

  const list = lists[0] ?? null
  const tasks = sortTasks(list?.tasks)
  const visibleTasks = tasks.filter(
    task => !(task.is_completed && initiallyCompletedTaskIds.has(task.id))
  )
  const taskIds = visibleTasks.map(task => task.id)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!list || isSubmittingNewTask) return

    const title = newTaskTitle.trim()
    if (!title) return

    setIsSubmittingNewTask(true)

    try {
      const createdTask = await createTodoTask(String(list.id), title)
      updateCurrentList(prev => ({
        ...prev,
        tasks: [...prev.tasks, createdTask],
        updated_at: createdTask.updated_at,
      }))
      setNewTaskTitle('')
      toast.success('已添加')
    } finally {
      setIsSubmittingNewTask(false)
    }
  }

  const handleToggle = useCallback(
    async (task: TodoTask) => {
      if (!list) return

      const updatedTask = await updateTodoTask(String(list.id), task.id, {
        is_completed: !task.is_completed,
      })

      updateCurrentList(prev => ({
        ...prev,
        tasks: prev.tasks.map(current => (current.id === task.id ? updatedTask : current)),
        updated_at: updatedTask.updated_at,
      }))
    },
    [list, updateCurrentList]
  )

  const handleTitleChange = useCallback(
    async (task: TodoTask, title: string) => {
      if (!list) return

      const nextTitle = title.trim()
      setEditingTaskId(null)

      if (!nextTitle || nextTitle === task.title) {
        return
      }

      const updatedTask = await updateTodoTask(String(list.id), task.id, { title: nextTitle })

      updateCurrentList(prev => ({
        ...prev,
        tasks: prev.tasks.map(current => (current.id === task.id ? updatedTask : current)),
        updated_at: updatedTask.updated_at,
      }))
    },
    [list, updateCurrentList]
  )

  const handleEndEdit = useCallback(() => {
    if (editingTaskId == null) return

    const task = tasks.find(current => current.id === editingTaskId)
    if (task && editTitle.trim() !== task.title) {
      void handleTitleChange(task, editTitle)
      return
    }

    setEditingTaskId(null)
  }, [editTitle, editingTaskId, handleTitleChange, tasks])

  const handleStartEdit = useCallback((task: TodoTask) => {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
  }, [])

  const handleReorder = useCallback(
    async (taskIdsInOrder: number[]) => {
      if (!list) return

      const updatedList = normalizeList(await reorderTodoTasks(String(list.id), taskIdsInOrder))
      updateCurrentList(() => updatedList)
    },
    [list, updateCurrentList]
  )

  const handleDeleteList = useCallback(async () => {
    if (!list || isDeletingList) return

    setIsDeletingList(true)

    try {
      await deleteTodoList(String(list.id))
      setDeleteDialogOpen(false)
      toast.success('已删除列表')
      await reloadLists()
    } finally {
      setIsDeletingList(false)
    }
  }, [isDeletingList, list, reloadLists])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = visibleTasks.findIndex(task => task.id === active.id)
    const newIndex = visibleTasks.findIndex(task => task.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedVisibleTasks = arrayMove(visibleTasks, oldIndex, newIndex)
    const reorderedVisibleIds = reorderedVisibleTasks.map(task => task.id)
    let visibleIndex = 0

    const reorderedTaskIds = tasks.map(task => {
      if (task.is_completed) {
        return task.id
      }

      const nextVisibleId = reorderedVisibleIds[visibleIndex]
      visibleIndex += 1
      return nextVisibleId
    })

    void handleReorder(reorderedTaskIds)
  }

  if (authLoading || isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="text-muted-foreground flex items-center justify-center py-12">加载中…</div>
      </PageContainer>
    )
  }

  if (loadError) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Button onClick={() => void reloadLists()}>重试</Button>
        </div>
      </PageContainer>
    )
  }

  if (!list) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-muted-foreground text-sm">暂无待办列表</p>
          <Button onClick={() => void reloadLists()}>重新加载</Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={list.name}
        description={list.description ?? undefined}
        singleLine
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            aria-label="删除列表"
            className="text-muted-foreground hover:border-destructive/30 hover:text-destructive"
            disabled={isDeletingList}
          >
            <Trash2 className="h-5 w-5" />
            <span>删除列表</span>
          </Button>
        }
      />

      <section className="border-border mb-6 border-b pb-4">
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={event => setNewTaskTitle(event.target.value)}
            placeholder="输入新任务…"
            aria-label="新任务"
            className="border-border bg-background focus:ring-primary flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            disabled={isSubmittingNewTask}
          />
          <Button type="submit" size="sm" loading={isSubmittingNewTask} loadingText="添加中">
            添加
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-base font-medium">待办事项</h2>
        {visibleTasks.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">暂无事项，在上方添加一条吧</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              <ul className="divide-border divide-y" role="list">
                {visibleTasks.map(task => (
                  <li key={task.id} role="listitem">
                    <TodoItemRow
                      task={task}
                      isCompleted={task.is_completed}
                      onToggle={() => void handleToggle(task)}
                      onTitleBlur={handleEndEdit}
                      isEditing={editingTaskId === task.id}
                      onStartEdit={() => handleStartEdit(task)}
                      editTitle={editingTaskId === task.id ? editTitle : ''}
                      onEditTitleChange={setEditTitle}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`删除「${list.name}」列表？`}
        description="删除后，该列表下的所有任务也将一并删除。"
        confirmText={isDeletingList ? '删除中…' : '删除'}
        onConfirm={() => void handleDeleteList()}
      />
    </PageContainer>
  )
}
