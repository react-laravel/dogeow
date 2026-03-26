import { NextRequest, NextResponse } from 'next/server'
import { loadAllDocuments } from '@/lib/knowledge/search'
import { buildVectorIndex, saveVectorIndex, loadVectorIndex } from '@/lib/knowledge/vector-store'
import { requireAuth } from '../../_lib/auth-guard'
import { getIdempotencyKey, serverIdempotency } from '@/lib/server/idempotency'
import { redisDistributedLock } from '@/lib/server/distributed-lock'

/**
 * Build vector index API endpoint
 * POST /api/knowledge/build-index
 *
 * Reliability features:
 * - Idempotency: Uses X-Idempotency-Key header to prevent duplicate index builds
 * - Distributed Lock: Uses Redis lock to prevent concurrent builds across instances
 */

// Lock resource name for build index operation
const BUILD_INDEX_LOCK = 'build-index'
const BUILD_LOCK_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * POST /api/knowledge/build-index
 * Build vector index
 */
export async function POST(request: NextRequest) {
  // Auth guard: require valid Bearer token
  const authError = requireAuth(request)
  if (authError) return authError

  // Get idempotency key from header
  const idempotencyKey = getIdempotencyKey(request)

  // Parse request body
  let body: { force?: boolean }
  try {
    body = await request.json()
  } catch {
    body = { force: false }
  }
  const { force = false } = body

  // Try to acquire distributed lock to prevent concurrent builds
  const lockResult = await redisDistributedLock.acquire(BUILD_INDEX_LOCK, {
    ttl: BUILD_LOCK_TTL,
    maxRetries: 0, // Don't retry - if lock is held, return error
  })

  if (!lockResult.acquired || !lockResult.token) {
    // Lock is held by another process (another build in progress)
    return NextResponse.json(
      {
        success: false,
        message: '索引构建已在进行中，请稍后重试',
        error: 'LOCK_HELD',
      },
      { status: 409 }
    )
  }

  try {
    // Check if index already exists (unless force rebuild)
    if (!force) {
      const existingIndex = loadVectorIndex()
      if (existingIndex) {
        // Return early but lock will be released in finally block
        return NextResponse.json({
          success: true,
          message: '向量索引已存在',
          indexSize: existingIndex.documents.length,
          createdAt: existingIndex.createdAt,
          updatedAt: existingIndex.updatedAt,
        })
      }
    }

    // If idempotency key provided, use idempotency handler
    // This ensures duplicate submissions return cached results instead of rebuilding
    if (idempotencyKey) {
      const result = await serverIdempotency.withIdempotency(
        `build-index:${idempotencyKey}`,
        async () => {
          return await doBuildIndex()
        },
        { ttl: 10 * 60 * 1000 } // 10 minutes for build index
      )

      if (result.isDuplicate) {
        // Return cached result if available
        if (result.result) {
          return NextResponse.json({
            success: true,
            message: '向量索引已存在（请求已处理）',
            indexSize: (result.result as { indexSize: number }).indexSize,
            ...(result.result as { createdAt?: string; updatedAt?: string }),
            idempotent: true,
          })
        }
        return NextResponse.json(
          {
            success: false,
            message: '请求正在处理中',
            error: 'REQUEST_IN_PROGRESS',
          },
          { status: 409 }
        )
      }

      if (result.error) {
        return NextResponse.json(
          {
            success: false,
            message: '构建向量索引失败',
            error: result.error,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '向量索引构建成功',
        indexSize: (result.result as { indexSize: number }).indexSize,
        ...(result.result as { createdAt?: string; updatedAt?: string }),
      })
    }

    // No idempotency key - build directly
    return await doBuildIndexResponse(force)
  } finally {
    // Always release the lock if we acquired it
    if (lockResult.token) {
      await redisDistributedLock.release(BUILD_INDEX_LOCK, lockResult.token)
    }
  }
}

/**
 * Internal function to build the index
 */
async function doBuildIndex(): Promise<{
  indexSize: number
  createdAt: string
  updatedAt: string
}> {
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
      debugInfo.testError = testError instanceof Error ? testError.message : String(testError)
    }

    throw Object.assign(
      new Error('没有找到任何文档'),
      { debugInfo }
    )
  }

  // Build vector index
  const index = await buildVectorIndex(documents)
  saveVectorIndex(index)

  return {
    indexSize: index.documents.length,
    createdAt: index.createdAt,
    updatedAt: index.updatedAt,
  }
}

/**
 * Build index and return response
 */
async function doBuildIndexResponse(force: boolean) {
  try {
    const result = await doBuildIndex()
    return NextResponse.json({
      success: true,
      message: '向量索引构建成功',
      indexSize: result.indexSize,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    })
  } catch (error: unknown) {
    console.error('构建向量索引失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    // Check if it's a "no documents" error
    if (errorMessage === '没有找到任何文档') {
      const debugInfo = (error as { debugInfo?: Record<string, unknown> }).debugInfo
      return NextResponse.json(
        {
          success: false,
          message: '没有找到任何文档',
          debug: debugInfo,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: '构建向量索引失败',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * Get index status
 * GET /api/knowledge/build-index
 */
export async function GET(request: NextRequest) {
  // Auth guard: require valid Bearer token
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const index = loadVectorIndex()
    if (!index) {
      return NextResponse.json({
        exists: false,
        message: '向量索引不存在',
      })
    }

    // Check if build is in progress
    const isLocked = await redisDistributedLock.isLocked(BUILD_INDEX_LOCK)

    return NextResponse.json({
      exists: true,
      indexSize: index.documents.length,
      createdAt: index.createdAt,
      updatedAt: index.updatedAt,
      version: index.version,
      buildInProgress: isLocked,
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
