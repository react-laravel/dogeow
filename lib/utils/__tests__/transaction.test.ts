import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TransactionContext, withTransaction, executeTransaction, withRetry } from '../transaction'

describe('Transaction Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe('TransactionContext', () => {
    it('should create a checkpoint', () => {
      const ctx = new TransactionContext<{ value: number }>()

      ctx.checkpoint({ value: 1 })
      const checkpoint = ctx.getLatestCheckpoint()

      expect(checkpoint).toEqual({ value: 1 })
    })

    it('should rollback to latest checkpoint', () => {
      const ctx = new TransactionContext<{ value: number }>()

      ctx.checkpoint({ value: 1 })
      ctx.checkpoint({ value: 2 })

      const rolledBack = ctx.rollback(new Error('Test error'))

      expect(rolledBack).toEqual({ value: 2 })
      expect(ctx.isRolledBack()).toBe(true)
      expect(ctx.getError()?.message).toBe('Test error')
    })

    it('should commit transaction', () => {
      const ctx = new TransactionContext<{ value: number }>()

      ctx.commit({ value: 42 })

      expect(ctx.isCommitted()).toBe(true)
      expect(ctx.getResult()).toEqual({ value: 42 })
    })

    it('should not rollback after commit', () => {
      const ctx = new TransactionContext<{ value: number }>()

      ctx.commit({ value: 1 })
      const result = ctx.rollback()

      expect(result).toBeNull()
      expect(ctx.isCommitted()).toBe(true)
    })

    it('should not commit after rollback', () => {
      const ctx = new TransactionContext<{ value: number }>()

      ctx.rollback(new Error('Test'))
      ctx.commit({ value: 1 })

      expect(ctx.isRolledBack()).toBe(true)
      expect(ctx.getResult()).toBeUndefined()
    })

    it('should limit checkpoints', () => {
      const ctx = new TransactionContext<{ value: number }>({ maxCheckpoints: 3 })

      ctx.checkpoint({ value: 1 })
      ctx.checkpoint({ value: 2 })
      ctx.checkpoint({ value: 3 })
      ctx.checkpoint({ value: 4 }) // Should remove value 1

      const checkpoint = ctx.getLatestCheckpoint()
      expect(checkpoint).toEqual({ value: 4 })
    })

    it('should call onRollback callback', () => {
      let callbackCalled = false
      let callbackError: Error | undefined

      const ctx = new TransactionContext<{ value: number }>({
        onRollback: error => {
          callbackCalled = true
          callbackError = error
        },
      })

      ctx.rollback(new Error('Callback test'))

      expect(callbackCalled).toBe(true)
      expect(callbackError?.message).toBe('Callback test')
    })
  })

  describe('withTransaction', () => {
    it('should execute function and commit', async () => {
      const result = await withTransaction(async ctx => {
        ctx.checkpoint({ step: 'start' })
        return { step: 'end' }
      })

      expect(result.success).toBe(true)
      expect(result.result).toEqual({ step: 'end' })
    })

    it('should rollback on error', async () => {
      const result = await withTransaction(async ctx => {
        ctx.checkpoint({ value: 1 })
        throw new Error('Test error')
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Test error')
    })

    it('should call onRollback callback', async () => {
      let rollbackCalled = false

      await withTransaction(
        async ctx => {
          ctx.checkpoint({ value: 1 })
          throw new Error('Test error')
        },
        {
          onRollback: () => {
            rollbackCalled = true
          },
        }
      )

      expect(rollbackCalled).toBe(true)
    })
  })

  describe('executeTransaction', () => {
    it('should execute all operations', async () => {
      const results = await executeTransaction([
        { name: 'op1', execute: async () => 'result1' },
        { name: 'op2', execute: async () => 'result2' },
        { name: 'op3', execute: async () => 'result3' },
      ])

      expect(results.success).toBe(true)
      expect(results.results).toEqual(['result1', 'result2', 'result3'])
      expect(results.errors).toHaveLength(0)
    })

    it('should rollback on failure', async () => {
      const rollbackOrder: string[] = []

      const results = await executeTransaction(
        [
          {
            name: 'op1',
            execute: async () => 'result1',
            rollback: async () => {
              rollbackOrder.push('op1')
            },
          },
          {
            name: 'op2',
            execute: async () => 'result2',
            rollback: async () => {
              rollbackOrder.push('op2')
            },
          },
          {
            name: 'op3',
            execute: async () => {
              throw new Error('op3 failed')
            },
            rollback: async () => {
              rollbackOrder.push('op3')
            },
          },
        ],
        { stopOnFailure: true }
      )

      expect(results.success).toBe(false)
      expect(results.errors).toHaveLength(1)
      expect(results.errors[0].name).toBe('op3')
      // Rollback should happen in reverse order
      expect(rollbackOrder).toEqual(['op2', 'op1'])
    })

    it('should not rollback when stopOnFailure is false', async () => {
      const rollbackOrder: string[] = []

      const results = await executeTransaction(
        [
          {
            name: 'op1',
            execute: async () => 'result1',
            rollback: async () => {
              rollbackOrder.push('op1')
            },
          },
          {
            name: 'op2',
            execute: async () => {
              throw new Error('op2 failed')
            },
            rollback: async () => {
              rollbackOrder.push('op2')
            },
          },
          {
            name: 'op3',
            execute: async () => 'result3',
            rollback: async () => {
              rollbackOrder.push('op3')
            },
          },
        ],
        { stopOnFailure: false }
      )

      expect(results.success).toBe(false)
      expect(results.errors).toHaveLength(1)
      // Should not rollback when stopOnFailure is false
      expect(rollbackOrder).toHaveLength(0)
    })

    it('should call onError callback', async () => {
      let errorIndex = -1

      await executeTransaction(
        [
          { name: 'op1', execute: async () => 'result1' },
          {
            name: 'op2',
            execute: async () => {
              throw new Error('Failed')
            },
          },
        ],
        {
          onError: (_error, index) => {
            errorIndex = index
          },
        }
      )

      expect(errorIndex).toBe(1)
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const result = await withRetry(async () => 'success')

      expect(result).toBe('success')
    })

    it('should retry on failure', async () => {
      vi.useFakeTimers()
      let attempts = 0

      const promise = withRetry(
        async () => {
          attempts++
          if (attempts < 3) {
            throw new Error(`Attempt ${attempts} failed`)
          }
          return 'success'
        },
        { maxAttempts: 3, initialDelayMs: 100 }
      )

      // Advance timers to let retries proceed
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('success')
      expect(attempts).toBe(3)
      vi.useRealTimers()
    })

    it('should throw after max attempts', async () => {
      vi.useFakeTimers()
      let attempts = 0

      const promise = withRetry(
        async () => {
          attempts++
          throw new Error('Always fails')
        },
        { maxAttempts: 3, initialDelayMs: 10 }
      )

      // Advance timers to let retries proceed
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Always fails')
      expect(attempts).toBe(3)
      vi.useRealTimers()
    })

    it('should call onRetry callback', async () => {
      vi.useFakeTimers()
      let retryAttempts: number[] = []

      const promise = withRetry(
        async () => {
          throw new Error('Test')
        },
        {
          maxAttempts: 3,
          initialDelayMs: 10,
          onRetry: attempt => {
            retryAttempts.push(attempt)
          },
        }
      )

      // Advance timers to let retries proceed
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow()
      expect(retryAttempts).toEqual([1, 2])
      vi.useRealTimers()
    })

    it('should only retry specific errors', async () => {
      vi.useFakeTimers()
      let attempts = 0

      class SpecificError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'SpecificError'
        }
      }

      type ErrorClass = new (...args: unknown[]) => Error

      const promise = withRetry(
        async () => {
          attempts++
          throw new SpecificError('Specific error')
        },
        {
          maxAttempts: 3,
          initialDelayMs: 10,
          retryableErrors: [SpecificError] as unknown as ErrorClass[],
        }
      )

      // Advance timers to let retries proceed
      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Specific error')
      expect(attempts).toBe(3)
      vi.useRealTimers()
    })

    it('should not retry non-retryable errors', async () => {
      let attempts = 0

      class SpecificError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'SpecificError'
        }
      }

      type ErrorClass = new (...args: unknown[]) => Error

      await expect(
        withRetry(
          async () => {
            attempts++
            throw new SpecificError('Non-retryable')
          },
          {
            maxAttempts: 3,
            initialDelayMs: 10,
            retryableErrors: [RangeError] as unknown as ErrorClass[],
          }
        )
      ).rejects.toThrow('Non-retryable')

      expect(attempts).toBe(1)
    })
  })
})
