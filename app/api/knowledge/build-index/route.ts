import { NextRequest, NextResponse } from 'next/server'
import { loadAllDocuments } from '@/lib/knowledge/search'
import { buildVectorIndex, saveVectorIndex, loadVectorIndex } from '@/lib/knowledge/vector-store'
import { requireAuth, requireAdmin } from '../../_lib/auth-guard'
import {
  idempotencyTracker,
  withIdempotencyAndLock,
  generateRequestId,
  type IdempotentResult,
} from '@/lib/utils/idempotency'
import { distributedLock, LockAcquisitionError } from '@/lib/utils/distributed-lock'

/**
 * 构建向量索引的 API 端点
 * POST /api/knowledge/build-index
 *
 * Features:
 * - Idempotency: Uses request ID header to prevent duplicate index builds
 * - Distributed Lock: Uses Redis when available for cross-instance locking
 * - Transaction Safety: Proper error handling and rollback on failure
 *
 * NOTE: When Redis is configured via REDIS_URL, idempotency and locking
 * work across distributed instances. Falls back to in-memory when Redis
 * is unavailable.
 */

const BUILD_RESOURCE = 'knowledge:build-index'
const BUILD_TTL = 5 * 60 * 1000 // 5 minutes

function getRequestId(request: NextRequest): string {
  return request.headers.get('X-Request-ID') || generateRequestId()
}

/**
 * POST /api/knowledge/build-index
 * 构建向量索引
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)

  // Auth guard: require valid Bearer token
  const authError = await requireAuth(request)
  if (authError) return authError

  // Admin guard: require admin role for rebuilding vector index (resource-intensive operation)
  const adminError = await requireAdmin(request)
  if (adminError) return adminError

  try {
    const { force = false } = await request.json().catch(() => ({ force: false }))

    // Execute with idempotency and distributed lock protection
    const result: IdempotentResult<void> = await withIdempotencyAndLock(
      '/api/knowledge/build-index',
      'POST',
      { force },
      async () => {
        // Use distributed lock to ensure only one build runs at a time
        const lockResult = await distributedLock.withLock(
          BUILD_RESOURCE,
          async () => {
            // Check if index already exists (only if not forcing rebuild)
            const existingIndex = loadVectorIndex()
            if (existingIndex && !force) {
              return {
                action: 'skipped',
                index: existingIndex,
                message: '向量索引已存在',
              }
            }

            // Load all documents
            const documents = await loadAllDocuments()
            if (documents.length === 0) {
              // Get debug info
              let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

              // Ensure URL ends with /api
              if (apiBaseUrl && !apiBaseUrl.endsWith('/api') && !apiBaseUrl.endsWith('/api/')) {
                apiBaseUrl = apiBaseUrl.endsWith('/') ? `${apiBaseUrl}api` : `${apiBaseUrl}/api`
              }

              // Try to test backend API directly
              let debugInfo: Record<string, unknown> = {
                apiUrl: apiBaseUrl,
                endpoint: `${apiBaseUrl}/notes/wiki/articles`,
              }

              try {
                const testResponse = await fetch(`${apiBaseUrl}/notes/wiki/articles`, {
                  cache: 'no-store',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })

                debugInfo.testResponseStatus = testResponse.status
                debugInfo.testResponseOk = testResponse.ok

                if (testResponse.ok) {
                  const testData = await testResponse.json()
                  debugInfo.testDataHasArticles = !!testData.articles
                  debugInfo.testArticlesCount = testData.articles?.length ?? 0
                } else {
                  debugInfo.testResponseText = await testResponse.text()
                }
              } catch (testError) {
                debugInfo.testError =
                  testError instanceof Error ? testError.message : String(testError)
              }

              throw Object.assign(new Error('没有找到任何文档'), { debug: debugInfo })
            }

            // Build vector index
            const index = await buildVectorIndex(documents)
            saveVectorIndex(index)

            return {
              action: 'built',
              index,
              message: '向量索引构建成功',
            }
          },
          { ttl: BUILD_TTL, maxRetries: 0 } // Don't retry - fail fast if locked
        )

        if (!lockResult.success) {
          if (lockResult.error instanceof LockAcquisitionError) {
            throw Object.assign(new Error('索引构建正在进行中，请稍后重试'), {
              code: 'LOCK_HELD',
              requestId,
            })
          }
          throw lockResult.error
        }

        return lockResult.result
      },
      {
        lockTtl: BUILD_TTL,
        idempotencyTtl: BUILD_TTL,
        onDuplicate: existingResult => {
          console.log(`[BuildIndex] Duplicate request detected: ${requestId}`)
        },
      }
    )

    // Handle duplicate submission
    if (result.isDuplicate && result.result) {
      const lockResult = result.result as { action: string; index?: unknown; message: string }
      return NextResponse.json({
        success: true,
        message: lockResult.message,
        indexSize: lockResult.index?.documents?.length ?? 0,
        createdAt: lockResult.index?.createdAt,
        updatedAt: lockResult.index?.updatedAt,
        idempotent: true,
        requestId: result.requestId,
      })
    }

    // Handle errors
    if (!result.success) {
      const error = result.error!
      const errorMessage = error.message || '未知错误'
      const debug = (error as { debug?: unknown }).debug

      // Check if this is a "no documents" error
      if (errorMessage === '没有找到任何文档') {
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            debug,
            requestId: result.requestId,
          },
          { status: 400 }
        )
      }

      // Check if this is a lock held error
      if ((error as { code?: string }).code === 'LOCK_HELD') {
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            requestId: result.requestId,
          },
          { status: 409 } // Conflict
        )
      }

      console.error('构建向量索引失败:', error)
      return NextResponse.json(
        {
          success: false,
          message: '构建向量索引失败',
          error: errorMessage,
          requestId: result.requestId,
        },
        { status: 500 }
      )
    }

    // Success
    const lockResult = result.result as { action: string; index: unknown; message: string }
    return NextResponse.json({
      success: true,
      message: lockResult.message,
      indexSize: lockResult.index?.documents?.length ?? 0,
      createdAt: lockResult.index?.createdAt,
      updatedAt: lockResult.index?.createdAt,
      requestId: result.requestId,
    })
  } catch (error: unknown) {
    console.error('构建向量索引失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      {
        success: false,
        message: '构建向量索引失败',
        error: errorMessage,
        requestId,
      },
      { status: 500 }
    )
  }
}

/**
 * 获取索引状态
 * GET /api/knowledge/build-index
 */
export async function GET(request: NextRequest) {
  // Auth guard: require valid Bearer token
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const index = loadVectorIndex()
    if (!index) {
      return NextResponse.json({
        exists: false,
        message: '向量索引不存在',
      })
    }

    return NextResponse.json({
      exists: true,
      indexSize: index.documents.length,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
      version: index.version,
    })
  } catch (error: unknown) {
    console.error('获取索引状态失败:', error)
    return NextResponse.json(
      {
        exists: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
