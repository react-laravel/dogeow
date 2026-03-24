'use client'

import { useEffect } from 'react'
import type { AIProvider } from '../request-model'
import {
  getStoredProvider,
  getStoredOllamaModel,
  getStoredZhipuaiModel,
  setStoredProvider,
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
    }
  }, [model, provider])

  // Initialize provider from storage
  const initializeProvider = (): AIProvider => {
    return getStoredProvider()
  }

  // Initialize model from storage based on provider
  const initializeModel = (currentProvider: AIProvider): string => {
    return currentProvider === 'zhipuai' ? getStoredZhipuaiModel() : getStoredOllamaModel()
  }

  return {
    initializeProvider,
    initializeModel,
  }
}
