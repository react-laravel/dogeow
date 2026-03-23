import { NextRequest, NextResponse } from 'next/server'
import { loadAllDocuments } from '@/lib/knowledge/search'
import { buildVectorIndex, saveVectorIndex, loadVectorIndex } from '@/lib/knowledge/vector-store'
import { requireAuth } from '../../_lib/auth-guard'
import { idempotencyTracker } from '@/lib/utils/idempotency'
// import { getRequestId } from '@/lib/utils/idempotency' // 已在本文件内实现
// getRequestId helper was removed from idempotency, using inline

/**
 * 构建向量索引的 API 端点
 * POST /api/knowledge/build-index
 *
 * Idempotency: Uses request ID header to prevent duplicate index builds
 *
 * NOTE: This implementation uses in-memory storage for idempotency tracking.
 * In a serverless environment (e.g., Vercel), each instance has its own memory,
 * so idempotency only works within a single instance. For true distributed
 * idempotency, a Redis or database-backed solution would be required.
 */

// Track in-progress index builds (per-instance only - see note above)
const inProgressBuilds = new Map<string, { timestamp: number; promise: Promise<unknown> }>()
const BUILD_TTL = 5 * 60 * 1000 // 5 minutes

function getRequestId(request: NextRequest): string {
  return request.headers.get('X-Request-ID') || `build-index-${Date.now()}`
}

function cleanupOldBuilds(): void {
  const now = Date.now()
  for (const [key, value] of inProgressBuilds.entries()) {
    if (now - value.timestamp > BUILD_TTL) {
      inProgressBuilds.delete(key)
    }
  }
}

/**
 * POST /api/knowledge/build-index
 * 构建向量索引
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)

  // Auth guard: require valid Bearer token
  const authError = requireAuth(request)
  if (authError) return authError

  try {
    const { force = false } = await request.json().catch(() => ({ force: false }))

    // Idempotency check: Check if this exact request is already in progress
    const existingBuild = inProgressBuilds.get(requestId)
    if (existingBuild && Date.now() - existingBuild.timestamp < BUILD_TTL) {
      console.log(`[BuildIndex] Request ${requestId} already in progress, waiting for result`)
      try {
        // Wait for the existing build to complete
        await existingBuild.promise
        // If we get here, the original request completed - return success
        const existingIndex = loadVectorIndex()
        return NextResponse.json({
          success: true,
          message: '向量索引已存在（请求已处理）',
          indexSize: existingIndex?.documents.length ?? 0,
          createdAt: existingIndex?.createdAt,
          updatedAt: existingIndex?.updatedAt,
          idempotent: true,
          requestId,
        })
      } catch (waitingError) {
        // Original request failed, allow retry
        console.warn(`[BuildIndex] Previous request ${requestId} failed, allowing retry:`, waitingError)
        inProgressBuilds.delete(requestId)
      }
    }

    // Check if index already exists (only if not forcing rebuild)
    const existingIndex = loadVectorIndex()
    if (existingIndex && !force) {
      return NextResponse.json({
        success: true,
        message: '向量索引已存在',
        indexSize: existingIndex.documents.length,
        createdAt: existingIndex.createdAt,
        updatedAt: existingIndex.updatedAt,
      })
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
        debugInfo.testError = testError instanceof Error ? testError.message : String(testError)
      }

      return NextResponse.json(
        {
          success: false,
          message: '没有找到任何文档',
          debug: debugInfo,
        },
        { status: 400 }
      )
    }

    // Build vector index with idempotency tracking
    cleanupOldBuilds()

    const buildPromise = (async () => {
      const index = await buildVectorIndex(documents)
      saveVectorIndex(index)
      return index
    })()

    // Track this build before starting
    inProgressBuilds.set(requestId, {
      timestamp: Date.now(),
      promise: buildPromise,
    })

    try {
      const index = await buildPromise

      return NextResponse.json({
        success: true,
        message: '向量索引构建成功',
        indexSize: index.documents.length,
        createdAt: index.createdAt,
        updatedAt: index.updatedAt,
        requestId,
      })
    } finally {
      // Clean up after completion (success or failure)
      inProgressBuilds.delete(requestId)
    }
  } catch (error: unknown) {
    console.error('构建向量索引失败:', error)
    // Clean up failed build from tracking
    inProgressBuilds.delete(requestId)
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
