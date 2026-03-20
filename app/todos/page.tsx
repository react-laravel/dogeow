'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Circle, GripVertical, Trash2 } from 'lucide-react'
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
import type { TodoList, TodoTask } from './types'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/helpers'
import useAuthStore from '@/stores/authStore'

const LEGACY_STORAGE_KEY = 'dogeow_todos'
const LEGACY_MIGRATION_KEY = 'dogeow_todos_api_migrated_v1'
const DEFAULT_LIST_NAME = '网站'
const DEFAULT_LIST_DESCRIPTION = '自己开发'
const EMPTY_TASKS: TodoTask[] = []

type TodoListWithTasks = Omit<TodoList, 'tasks'> & { tasks: TodoTask[] }
type LegacyTodoList = TodoListWithTasks

function sortTasks(tasks: TodoTask[] | undefined): TodoTask[] {
  return [...(tasks ?? EMPTY_TASKS)].sort((a, b) => a.position - b.position)
}

function normalizeList(list: TodoList): TodoListWithTasks {
  return {
    ...list,
    tasks: sortTasks(list.tasks),
  }
}

function readLegacyLocalLists(): LegacyTodoList[] {
  if (typeof window === 'undefined') return []

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as TodoList[]
    if (!Array.isArray(parsed)) return []

    return parsed.map(list => normalizeList(list))
  } catch {
    return []
  }
}

function getLegacySeedList(): LegacyTodoList | null {
  return readLegacyLocalLists()[0] ?? null
}

function hasLegacyMigrationCompleted(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(LEGACY_MIGRATION_KEY) === '1'
}

function clearLegacyLocalData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

function markLegacyMigrationCompleted(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LEGACY_MIGRATION_KEY, '1')
  clearLegacyLocalData()
}

function getDefaultListPayload(seed: LegacyTodoList | null): {
  name: string
  description: string
} {
  return {
    name: seed?.name?.trim() || DEFAULT_LIST_NAME,
    description: seed?.description?.trim() || DEFAULT_LIST_DESCRIPTION,
  }
}

function buildTaskSignature(task: TodoTask): string {
  return `${task.title.trim()}::${task.is_completed ? '1' : '0'}`
}

function TodoItemRow({
  task,
  isCompleted,
  onToggle,
  onTitleBlur,
  isEditing,
  onStartEdit,
  editTitle,
  onEditTitleChange,
}: {
  task: TodoTask
  isCompleted: boolean
  onToggle: () => void
  onTitleBlur: () => void
  isEditing: boolean
  onStartEdit: () => void
  editTitle: string
  onEditTitleChange: (value: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg py-2.5 pr-2 transition-colors',
        isDragging && 'opacity-60 shadow-lg'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 rounded-full p-0.5 text-muted-foreground outline-none hover:text-foreground focus:ring-2 focus:ring-primary"
        aria-label={isCompleted ? '标记未完成' : '标记完成'}
      >
        {isCompleted ? (
          <Check className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" strokeWidth={2} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={event => onEditTitleChange(event.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={event => event.key === 'Enter' && onTitleBlur()}
            className="w-full bg-transparent py-0.5 text-sm focus:outline-none focus:ring-0"
            autoFocus
            aria-label="编辑任务"
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className={cn(
              'w-full rounded py-0.5 text-left text-sm outline-none focus:ring-0',
              isCompleted && 'text-muted-foreground line-through'
            )}
          >
            {task.title || '未命名'}
          </button>
        )}
      </div>
      <button
        type="button"
        className="touch-none -ml-1 cursor-grab rounded p-1 text-muted-foreground outline-none hover:text-foreground active:cursor-grabbing"
        aria-label="拖动排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function TodosPage() {
  const { isAuthenticated, loading: authLoading } = useAuthStore()
  const [lists, setLists] = useState<TodoListWithTasks[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSubmittingNewTask, setIsSubmittingNewTask] = useState(false)
  const [isDeletingList, setIsDeletingList] = useState(false)
  const hasInitializedRef = useRef(false)

  const updateCurrentList = useCallback(
    (updater: (prev: TodoListWithTasks) => TodoListWithTasks) => {
      setLists(prev => {
        if (prev.length === 0) return prev
        return [normalizeList(updater(prev[0])), ...prev.slice(1)]
      })
    },
    []
  )

  const migrateLegacyTodos = useCallback(
    async (targetList: TodoListWithTasks): Promise<boolean> => {
      if (typeof window === 'undefined' || hasLegacyMigrationCompleted()) {
        return false
      }

      const legacyList = getLegacySeedList()
      if (!legacyList) {
        markLegacyMigrationCompleted()
        return false
      }

      const legacyTasks = sortTasks(legacyList.tasks).filter(task => task.title.trim())
      if (legacyTasks.length === 0) {
        markLegacyMigrationCompleted()
        return false
      }

      const existingSignatures = new Set(targetList.tasks.map(buildTaskSignature))
      let migratedCount = 0

      for (const legacyTask of legacyTasks) {
        const title = legacyTask.title.trim()
        const signature = buildTaskSignature({ ...legacyTask, title })

        if (!title || existingSignatures.has(signature)) {
          continue
        }

        const createdTask = await createTodoTask(String(targetList.id), title)

        if (legacyTask.is_completed) {
          await updateTodoTask(String(targetList.id), createdTask.id, { is_completed: true })
        }

        existingSignatures.add(signature)
        migratedCount += 1
      }

      markLegacyMigrationCompleted()

      if (migratedCount > 0) {
        toast.success(`已迁移 ${migratedCount} 条本地待办`)
      }

      return migratedCount > 0
    },
    []
  )

  const initializeLists = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      let nextLists = (await fetchTodoLists()).map(normalizeList)

      if (nextLists.length === 0) {
        const createdList = await createTodoList(getDefaultListPayload(getLegacySeedList()))
        nextLists = [normalizeList(await fetchTodoList(String(createdList.id)))]
      }

      if (nextLists.length === 0) {
        throw new Error('初始化待办列表失败')
      }

      setIsMigrating(true)
      const migrated = await migrateLegacyTodos(nextLists[0])
      if (migrated) {
        nextLists = (await fetchTodoLists()).map(normalizeList)
      }

      setLists(nextLists)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '加载待办失败')
    } finally {
      setIsMigrating(false)
      setIsLoading(false)
    }
  }, [migrateLegacyTodos])

  useEffect(() => {
    if (authLoading || !isAuthenticated || hasInitializedRef.current) return

    hasInitializedRef.current = true
    void initializeLists()
  }, [authLoading, initializeLists, isAuthenticated])

  const list = lists[0] ?? null
  const tasks = sortTasks(list?.tasks)
  const taskIds = tasks.map(task => task.id)
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
      await initializeLists()
    } finally {
      setIsDeletingList(false)
    }
  }, [initializeLists, isDeletingList, list])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tasks.findIndex(task => task.id === active.id)
    const newIndex = tasks.findIndex(task => task.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    void handleReorder(arrayMove(tasks, oldIndex, newIndex).map(task => task.id))
  }

  if (authLoading || isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="text-muted-foreground flex items-center justify-center py-12">
          {isMigrating ? '正在迁移本地待办…' : '加载中…'}
        </div>
      </PageContainer>
    )
  }

  if (loadError) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Button onClick={() => void initializeLists()}>重试</Button>
        </div>
      </PageContainer>
    )
  }

  if (!list) {
    return (
      <PageContainer maxWidth="2xl">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-muted-foreground text-sm">暂无待办列表</p>
          <Button onClick={() => void initializeLists()}>重新加载</Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={list.name}
        description={list.description ?? undefined}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            aria-label="删除列表"
            className="text-muted-foreground hover:text-destructive"
            disabled={isDeletingList}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        }
      />

      <section className="border-border mb-6 border-b pb-4">
        <p className="text-muted-foreground mb-2 text-sm">我</p>
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={event => setNewTaskTitle(event.target.value)}
            placeholder="任务"
            aria-label="新任务"
            className="border-border bg-background focus:ring-primary flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            disabled={isSubmittingNewTask}
          />
          <Button type="submit" size="sm" disabled={isSubmittingNewTask}>
            添加
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-base font-medium">代办事项</h2>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">暂无事项，在上方添加一条吧</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              <ul className="divide-border divide-y" role="list">
                {tasks.map(task => (
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
