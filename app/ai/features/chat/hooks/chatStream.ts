export async function readAiChatStream(
  response: Response,
  onProgress: (content: string) => void
): Promise<string> {
  if (!response.body) {
    throw new Error('Response body is null')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let accumulatedContent = ''

  const appendContentFromLine = (line: string, warningMessage: string) => {
    try {
      const content = JSON.parse(line.slice(2))
      if (typeof content !== 'string') {
        return
      }

      accumulatedContent += content
      onProgress(accumulatedContent)
    } catch {
      console.warn(warningMessage, line)
    }
  }

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) {
        continue
      }

      if (line.startsWith('0:')) {
        appendContentFromLine(line, 'Failed to parse content chunk:')
      }

      if (line.startsWith('d:')) {
        try {
          JSON.parse(line.slice(2))
          return accumulatedContent
        } catch {
          console.warn('Failed to parse metadata:', line)
        }
      }
    }
  }

  if (buffer.trim() && buffer.startsWith('0:')) {
    appendContentFromLine(buffer, 'Failed to parse remaining buffer:')
  }

  return accumulatedContent
}

export async function readOllamaChatStream(
  response: Response,
  onProgress: (content: string) => void
): Promise<string> {
  if (!response.body) {
    throw new Error('Response body is null')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let accumulatedContent = ''

  const appendContentFromLine = (line: string) => {
    try {
      const data = JSON.parse(line) as { response?: string; message?: { content?: string } }
      const content = data.response ?? data.message?.content ?? ''
      if (!content) {
        return false
      }

      accumulatedContent += content
      onProgress(accumulatedContent)
      return Boolean(data)
    } catch {
      console.warn('Failed to parse Ollama chunk:', line)
      return false
    }
  }

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) {
        continue
      }

      try {
        const data = JSON.parse(line) as {
          done?: boolean
          response?: string
          message?: { content?: string }
        }
        const content = data.response ?? data.message?.content ?? ''
        if (content) {
          accumulatedContent += content
          onProgress(accumulatedContent)
        }
        if (data.done) {
          return accumulatedContent
        }
      } catch {
        console.warn('Failed to parse Ollama chunk:', line)
      }
    }
  }

  if (buffer.trim()) {
    appendContentFromLine(buffer)
  }

  return accumulatedContent
}
