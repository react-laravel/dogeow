import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import { POST } from '../route'

// Mock fetch
global.fetch = vi.fn()

// Mock requireAuth
vi.mock('../../_lib/auth-guard', () => ({
  requireAuth: vi.fn(() => null),
}))

describe('Generate API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: vi.fn().mockResolvedValue(body),
      cookies: {} as Record<string, string>,
      nextUrl: {} as URL,
      page: {} as Record<string, unknown>,
      ua: {} as Record<string, unknown>,
      headers: new Headers(),
      method: 'POST',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      clone: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
      signal: {} as AbortSignal,
      cache: 'default',
      credentials: 'same-origin',
      destination: 'document',
      integrity: '',
      keepalive: false,
      mode: 'cors',
      redirect: 'follow',
      referrer: '',
      referrerPolicy: 'no-referrer',
      url: 'http://localhost:3000/api/generate',
    } as unknown as NextRequest
  }

  it('should handle invalid option', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
    } as unknown as Response)

    const request = createMockRequest({
      option: 'invalid',
      text: '测试文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalled()
  })

  it('should handle missing text', async () => {
    const request = createMockRequest({
      option: 'improve',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle Ollama API errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const request = createMockRequest({
      option: 'improve',
      text: '测试文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const request = createMockRequest({
      option: 'improve',
      text: '测试文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle improve option with valid request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'improve',
      text: '原始文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '请改进以下文本的表达和流畅性，保持原意不变：\n\n原始文本',
        stream: true,
      }),
    })
  })

  it('should handle fix option with valid request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'fix',
      text: '有错误的文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '请修正以下文本的语法和拼写错误：\n\n有错误的文本',
        stream: true,
      }),
    })
  })

  it('should handle zap option with command', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'zap',
      text: '原文内容',
      command: '自定义命令',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '自定义命令\n\n原文：原文内容',
        stream: true,
      }),
    })
  })

  it('should handle shorter option with valid request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'shorter',
      text: '这是一段很长的文本需要简化',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '请将以下文本简化，保留核心信息：\n\n这是一段很长的文本需要简化',
        stream: true,
      }),
    })
  })

  it('should handle longer option with valid request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'longer',
      text: '简短的文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '请扩展以下文本，添加更多细节和信息：\n\n简短的文本',
        stream: true,
      }),
    })
  })

  it('should handle continue option with valid request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'continue',
      text: '继续写下去的内容',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '请继续写下去：\n\n继续写下去的内容',
        stream: true,
      }),
    })
  })

  it('should handle useChat option with messages (chat mode)', async () => {
    const mockChatResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockChatResponse)

    const request = createMockRequest({
      useChat: true,
      messages: [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！有什么可以帮助你的吗？' },
        { role: 'user', content: '今天天气如何？' },
      ],
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        messages: [
          { role: 'system', content: '你是一个有用的AI助理，请用中文回答问题。' },
          { role: 'user', content: '你好' },
          { role: 'assistant', content: '你好！有什么可以帮助你的吗？' },
          { role: 'user', content: '今天天气如何？' },
        ],
        stream: true,
      }),
    })
  })

  it('should handle useChat with custom command', async () => {
    const mockChatResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockChatResponse)

    const request = createMockRequest({
      useChat: true,
      command: '你是一个诗人，用诗意的语言回答',
      messages: [{ role: 'user', content: '描述一下春天' }],
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        messages: [
          { role: 'system', content: '你是一个诗人，用诗意的语言回答' },
          { role: 'user', content: '描述一下春天' },
        ],
        stream: true,
      }),
    })
  })

  it('should not use chat mode when messages array is empty', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      useChat: true,
      messages: [],
      option: 'improve',
      text: '测试文本',
    })

    const response = await POST(request)

    // Should fall back to generate mode since messages is empty
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '请改进以下文本的表达和流畅性，保持原意不变：\n\n测试文本',
        stream: true,
      }),
    })
  })

  it('should handle invalid JSON in request body', async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      cookies: {} as Record<string, string>,
      nextUrl: {} as URL,
      page: {} as Record<string, unknown>,
      ua: {} as Record<string, unknown>,
      headers: {} as Headers,
      method: 'POST',
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      clone: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
      signal: {} as AbortSignal,
      cache: 'default',
      credentials: 'same-origin',
      destination: 'document',
      integrity: '',
      keepalive: false,
      mode: 'cors',
      redirect: 'follow',
      referrer: '',
      referrerPolicy: 'no-referrer',
      url: 'http://localhost:3000/api/generate',
    } as unknown as NextRequest

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should handle text with only whitespace as empty', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'improve',
      text: '   ',
    })

    const response = await POST(request)

    // Whitespace-only text should trigger 400 due to trim() check
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('缺少必要参数')
  })

  it('should handle unknown option and fall back to default prompt', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'unknown_option' as any,
      text: '测试文本',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    // Unknown options fall back to default prompt template
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:0.6b',
        prompt: '请处理以下文本：\n\n测试文本',
        stream: true,
      }),
    })
  })

  it('should use custom model when specified', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        })),
      },
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default',
      url: '',
      clone: vi.fn(),
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      json: vi.fn(),
      text: vi.fn(),
      bodyUsed: false,
      bytes: vi.fn().mockResolvedValue(new Uint8Array()),
    } as unknown as Response

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const request = createMockRequest({
      option: 'improve',
      text: '测试',
      model: 'llama3:8b',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3:8b',
        prompt: '请改进以下文本的表达和流畅性，保持原意不变：\n\n测试',
        stream: true,
      }),
    })
  })
})
