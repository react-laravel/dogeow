'use client'

import { useEffect } from 'react'
import type { AIProvider } from '../request-model'
import {
  getStoredProvider,
  getStoredOllamaModel,
  getStoredCodexModel,
  getStoredZhipuaiModel,
  setStoredProvider,
  setStoredCodexModel,
  setStoredOllamaModel,
  setStoredZhipuaiModel,
} from './modelStorage'

interface UseChatModelStorageOptions {
  provider: AIProvider
  model: string
  setProvider: (value: AIProvider) => void
  setModel: (value: string) => void
}

export function useChatModelStorage({
  provider,
  model,
  setProvider,
  setModel,
}: UseChatModelStorageOptions) {
  // When provider changes, persist to localStorage
  useEffect(() => {
    setStoredProvider(provider)
  }, [provider])

  // When provider changes, restore the last selected model for that provider
  useEffect(() => {
    if (provider === 'ollama') {
      setModel(getStoredOllamaModel())
      return
    }

    if (provider === 'zhipuai') {
      setModel(getStoredZhipuaiModel())
      return
    }

    if (provider === 'codex') {
      setModel(getStoredCodexModel())
    }
  }, [provider, setModel])

  // Persist model selection based on current provider
  useEffect(() => {
    if (provider === 'ollama') {
      setStoredOllamaModel(model)
      return
    }

    if (provider === 'zhipuai') {
      setStoredZhipuaiModel(model)
      return
    }

    if (provider === 'codex') {
      setStoredCodexModel(model)
    }
  }, [model, provider])

  // Initialize provider from storage
  const initializeProvider = (): AIProvider => {
    return getStoredProvider()
  }

  // Initialize model from storage based on provider
  const initializeModel = (currentProvider: AIProvider): string => {
    if (currentProvider === 'codex') return getStoredCodexModel()
    return currentProvider === 'zhipuai' ? getStoredZhipuaiModel() : getStoredOllamaModel()
  }

  return {
    initializeProvider,
    initializeModel,
  }
}
