/**
 * Transaction handling utilities
 * Provides proper transaction boundaries with rollback support for frontend operations
 */

type TransactionState<T> = {
  /** Whether the transaction has been committed */
  committed: boolean
  /** Whether the transaction has been rolled back */
  rolledBack: boolean
  /** The result of the transaction if committed */
  result?: T
  /** Error if transaction failed or was rolled back */
  error?: Error
}

/**
 * Transaction context for managing state changes with rollback capability
 */
export class TransactionContext<T = unknown> {
  private state: TransactionState<T> = {
    committed: false,
    rolledBack: false,
  }
  private checkpoints: Array<{ state: T; timestamp: number }> = []
  private maxCheckpoints: number
  private onRollback?: (error: Error) => void

  constructor(options: { maxCheckpoints?: number; onRollback?: (error: Error) => void } = {}) {
    this.maxCheckpoints = options.maxCheckpoints ?? 10
    this.onRollback = options.onRollback
  }

  /**
   * Create a checkpoint for potential rollback
   */
  checkpoint(state: T): void {
    if (this.state.committed || this.state.rolledBack) {
      console.warn('[Transaction] Cannot create checkpoint - transaction already finalized')
      return
    }

    // Limit number of checkpoints
    if (this.checkpoints.length >= this.maxCheckpoints) {
      this.checkpoints.shift()
    }

    this.checkpoints.push({
      state: this.cloneState(state),
      timestamp: Date.now(),
    })
  }

  /**
   * Get the latest checkpoint
   */
  getLatestCheckpoint(): T | null {
    const checkpoint = this.checkpoints[this.checkpoints.length - 1]
    return checkpoint ? this.cloneState(checkpoint.state) : null
  }

  /**
   * Rollback to the latest checkpoint
   */
  rollback(error?: Error): T | null {
    if (this.state.committed) {
      console.warn('[Transaction] Cannot rollback - transaction already committed')
      return null
    }

    if (this.state.rolledBack) {
      console.warn('[Transaction] Already rolled back')
      return null
    }

    this.state.rolledBack = true
    this.state.error = error ?? new Error('Transaction rolled back')

    if (this.onRollback) {
      this.onRollback(this.state.error)
    }

    const checkpoint = this.checkpoints.pop()
    if (checkpoint) {
      return this.cloneState(checkpoint.state)
    }

    return null
  }

  /**
   * Commit the transaction
   */
  commit(result: T): void {
    if (this.state.rolledBack) {
      console.warn('[Transaction] Cannot commit - transaction already rolled back')
      return
    }

    this.state.committed = true
    this.state.result = result
    this.checkpoints = [] // Clear checkpoints after commit
  }

  /**
   * Check if transaction is committed
   */
  isCommitted(): boolean {
    return this.state.committed
  }

  /**
   * Check if transaction is rolled back
   */
  isRolledBack(): boolean {
    return this.state.rolledBack
  }

  /**
   * Get transaction result
   */
  getResult(): T | undefined {
    return this.state.result
  }

  /**
   * Get transaction error
   */
  getError(): Error | undefined {
    return this.state.error
  }

  /**
   * Clone state to avoid reference issues
   * Uses JSON serialization as a simple deep clone
   */
  private cloneState(state: T): T {
    try {
      return JSON.parse(JSON.stringify(state)) as T
    } catch {
      // If serialization fails, return as-is
      return state
    }
  }
}

/**
 * Execute a function with transaction support
 */
export async function withTransaction<T>(
  fn: (ctx: TransactionContext<T>) => Promise<T>,
  options: { onRollback?: (error: Error) => void } = {}
): Promise<{ success: boolean; result?: T; error?: Error }> {
  const ctx = new TransactionContext<T>({ onRollback: options.onRollback })

  try {
    const result = await fn(ctx)

    if (!ctx.isRolledBack()) {
      ctx.commit(result)
      return { success: true, result }
    }

    // Was rolled back
    return { success: false, error: ctx.getError() }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    ctx.rollback(err)
    return { success: false, error: err }
  }
}

/**
 * Execute multiple operations in a transaction
 * All operations must succeed for the transaction to commit
 */
export async function executeTransaction<T, R = T>(
  operations: Array<{
    name: string
    execute: () => Promise<T>
    rollback?: (result: T) => Promise<void>
  }>,
  options: { stopOnFailure?: boolean; onError?: (error: Error, index: number) => void } = {}
): Promise<{ success: boolean; results: T[]; errors: Array<{ name: string; error: Error }> }> {
  const { stopOnFailure = true, onError } = options
  const results: T[] = []
  const errors: Array<{ name: string; error: Error }> = []

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i]

    try {
      console.log(`[Transaction] Executing: ${operation.name}`)
      const result = await operation.execute()
      results.push(result)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(`[Transaction] Error in ${operation.name}:`, err)

      errors.push({ name: operation.name, error: err })
      onError?.(err, i)

      if (stopOnFailure) {
        // Rollback previous successful operations
        console.log(`[Transaction] Rolling back ${results.length} previous operations`)
        for (let j = results.length - 1; j >= 0; j--) {
          const rollbackOp = operations[j].rollback
          if (rollbackOp) {
            try {
              console.log(`[Transaction] Rolling back: ${operations[j].name}`)
              await rollbackOp(results[j])
            } catch (rollbackError) {
              console.error(
                `[Transaction] Rollback failed for ${operations[j].name}:`,
                rollbackError
              )
            }
          }
        }
        break
      }
    }
  }

  if (errors.length > 0 && stopOnFailure) {
    return { success: false, results, errors }
  }

  return { success: errors.length === 0, results, errors }
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number
    initialDelayMs?: number
    maxDelayMs?: number
    backoffMultiplier?: number
    retryableErrors?: Array<new (...args: unknown[]) => Error>
    onRetry?: (attempt: number, error: Error) => void
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryableErrors = [],
    onRetry,
  } = options

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if error is retryable
      const isRetryable =
        retryableErrors.length === 0 ||
        retryableErrors.some(errClass => lastError instanceof errClass)

      if (!isRetryable || attempt >= maxAttempts) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt - 1), maxDelayMs)

      console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message)
      onRetry?.(attempt, lastError)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError ?? new Error('Retry operation failed')
}

/**
 * Combined transaction with retry support
 */
export async function withTransactionAndRetry<T>(
  operations: Array<{
    name: string
    execute: () => Promise<T>
    rollback?: (result: T) => Promise<void>
  }>,
  transactionOptions: Parameters<typeof executeTransaction>[1] = {},
  retryOptions: Parameters<typeof withRetry>[1] = {}
): Promise<{ success: boolean; results: T[]; errors: Array<{ name: string; error: Error }> }> {
  const defaultRetryOptions = {
    retryableErrors: [Error] as unknown as Array<new (...args: unknown[]) => Error>,
  }
  const mergedOptions = { ...defaultRetryOptions, ...retryOptions }
  return withRetry(() => executeTransaction(operations, transactionOptions), mergedOptions)
}
