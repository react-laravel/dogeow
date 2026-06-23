import { describe, it, expect } from 'vitest'
import type { OllamaTagModel, OllamaShowResponse } from '../ollama-models'
import {
  isCloudModel,
  isEmbeddingByHeuristic,
  isChatCapableModel,
  getOllamaModelExclusionReason,
  supportsVision,
  buildOllamaModelList,
} from '../ollama-models'

const makeModel = (overrides: Partial<OllamaTagModel> = {}): OllamaTagModel => ({
  name: 'test-model',
  model: 'test-model:latest',
  size: 1000000,
  modified_at: '2024-01-01T00:00:00Z',
  details: {
    family: 'llama',
    parameter_size: '7B',
    quantization_level: 'Q4_0',
    format: 'gguf',
  },
  ...overrides,
})

const makeShow = (overrides: Partial<OllamaShowResponse> = {}): OllamaShowResponse => ({
  capabilities: ['completion'],
  details: {
    family: 'llama',
    parameter_size: '7B',
    quantization_level: 'Q4_0',
  },
  model_info: {},
  ...overrides,
})

describe('ollama-models', () => {
  describe('isCloudModel', () => {
    it('should return true when model name ends with :cloud', () => {
      expect(isCloudModel(makeModel({ name: 'gpt-4:cloud' }))).toBe(true)
    })

    it('should return true when model.model ends with :cloud', () => {
      expect(isCloudModel(makeModel({ model: 'claude:cloud' }))).toBe(true)
    })

    it('should return false for regular model names', () => {
      expect(isCloudModel(makeModel({ name: 'llama3' }))).toBe(false)
      expect(isCloudModel(makeModel({ name: 'mistral' }))).toBe(false)
    })

    it('should return false for non-string model names', () => {
      expect(isCloudModel(makeModel({ name: undefined as unknown as string }))).toBe(false)
    })
  })

  describe('isEmbeddingByHeuristic', () => {
    it('should detect embedding by name patterns', () => {
      expect(isEmbeddingByHeuristic(makeModel({ name: 'nomic-embed-text' }))).toBe(true)
      expect(isEmbeddingByHeuristic(makeModel({ name: 'embeddinggemma:latest' }))).toBe(true)
      expect(isEmbeddingByHeuristic(makeModel({ name: 'all-minilm' }))).toBe(true)
      expect(isEmbeddingByHeuristic(makeModel({ name: 'mxbai-embed-large' }))).toBe(true)
      expect(isEmbeddingByHeuristic(makeModel({ name: 'bge-small-en' }))).toBe(true)
      expect(isEmbeddingByHeuristic(makeModel({ name: 'snowflake-arctic-embed' }))).toBe(true)
      expect(isEmbeddingByHeuristic(makeModel({ name: 'qwen2.5-embedding' }))).toBe(true)
    })

    it('should detect embedding by family patterns', () => {
      const show = makeShow({ details: { family: 'bert' } })
      expect(isEmbeddingByHeuristic(makeModel(), show)).toBe(true)

      const show2 = makeShow({ details: { family: 'embed' } })
      expect(isEmbeddingByHeuristic(makeModel(), show2)).toBe(true)
    })

    it('should return false for chat models', () => {
      expect(isEmbeddingByHeuristic(makeModel({ name: 'llama3' }))).toBe(false)
      expect(isEmbeddingByHeuristic(makeModel({ name: 'mistral' }))).toBe(false)
    })

    it('should use show details for family detection', () => {
      const show = makeShow({ details: { family: 'bert' } })
      const model = makeModel({ name: 'custom-model', details: { family: 'llama' } })
      expect(isEmbeddingByHeuristic(model, show)).toBe(true)
    })
  })

  describe('isChatCapableModel', () => {
    it('should return false for cloud models', () => {
      expect(isChatCapableModel(makeModel({ name: 'gpt-4:cloud' }))).toBe(false)
    })

    it('should return true when capabilities include completion', () => {
      const show = makeShow({ capabilities: ['completion', 'vision'] })
      expect(isChatCapableModel(makeModel(), show)).toBe(true)
    })

    it('should return false when capabilities only include embedding', () => {
      const show = makeShow({ capabilities: ['embedding'] })
      expect(isChatCapableModel(makeModel(), show)).toBe(false)
    })

    it('should return false when capabilities is empty and model is embedding', () => {
      const show = makeShow({ capabilities: [] })
      expect(isChatCapableModel(makeModel({ name: 'nomic-embed-text' }), show)).toBe(false)
    })

    it('should return true when capabilities is empty and model is chat', () => {
      const show = makeShow({ capabilities: [] })
      expect(isChatCapableModel(makeModel({ name: 'llama3' }), show)).toBe(true)
    })
  })

  describe('getOllamaModelExclusionReason', () => {
    it('should return cloud reason for cloud models', () => {
      expect(getOllamaModelExclusionReason(makeModel({ name: 'gpt-4:cloud' }))).toBe(
        'cloud 标签模型'
      )
    })

    it('should return embedding reason for embedding-capable models', () => {
      const show = makeShow({ capabilities: ['embedding'] })
      expect(getOllamaModelExclusionReason(makeModel(), show)).toBe('embedding 能力模型')
    })

    it('should return embedding heuristic reason', () => {
      expect(getOllamaModelExclusionReason(makeModel({ name: 'nomic-embed-text' }))).toBe(
        'embedding 特征模型'
      )
    })

    it('should return null for valid chat models', () => {
      expect(getOllamaModelExclusionReason(makeModel({ name: 'llama3' }))).toBeNull()
    })
  })

  describe('supportsVision', () => {
    it('should return true when capabilities include vision', () => {
      const show = makeShow({ capabilities: ['vision', 'completion'] })
      expect(supportsVision(makeModel(), show)).toBe(true)
    })

    it('should return true for known vision model names', () => {
      expect(supportsVision(makeModel({ name: 'llava:latest' }))).toBe(true)
      expect(supportsVision(makeModel({ name: 'minicpm-v' }))).toBe(true)
      expect(supportsVision(makeModel({ name: 'my-vision-model' }))).toBe(true)
    })

    it('should return false when no vision indicators', () => {
      const show = makeShow({ capabilities: ['completion'] })
      expect(supportsVision(makeModel({ name: 'llama3' }), show)).toBe(false)
    })

    it('should return false when capabilities do not include vision', () => {
      const show = makeShow({ capabilities: ['completion'] })
      // capabilities is non-empty and does not include 'vision', so returns false regardless of name
      expect(supportsVision(makeModel({ name: 'any-model' }), show)).toBe(false)
    })

    it('should handle empty capabilities with non-vision name', () => {
      const show = makeShow({ capabilities: [] })
      expect(supportsVision(makeModel({ name: 'llama3' }), show)).toBe(false)
    })
  })

  describe('buildOllamaModelList', () => {
    it('should filter out non-chat-capable models', () => {
      // nomic-embed-text is an embedding model, gpt-4:cloud is a cloud model
      // Only llama3 should remain
      const enriched = [
        {
          model: makeModel({ name: 'llama3', model: 'llama3:latest' }),
          show: makeShow({ capabilities: ['completion'] }),
        },
        {
          model: makeModel({ name: 'nomic-embed-text' }),
          show: makeShow({ capabilities: ['embedding'] }),
        },
        {
          model: makeModel({ name: 'gpt-4:cloud' }),
          show: makeShow(),
        },
      ]

      const result = buildOllamaModelList(enriched)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('llama3')
    })

    it('should map model properties correctly', () => {
      const enriched = [
        {
          model: makeModel({
            name: 'my-model',
            size: 5000000,
            modified_at: '2024-06-01T00:00:00Z',
            details: { family: 'llama', parameter_size: '13B', quantization_level: 'Q5_K_M' },
          }),
          show: makeShow({
            details: { family: 'llama', parameter_size: '13B', quantization_level: 'Q5_K_M' },
          }),
        },
      ]

      const result = buildOllamaModelList(enriched)
      expect(result[0]).toEqual({
        name: 'my-model',
        size: 5000000,
        modifiedAt: '2024-06-01T00:00:00Z',
        family: 'llama',
        parameterSize: '13B',
        quantizationLevel: 'Q5_K_M',
        supportsVision: false,
      })
    })

    it('should prefer show details over model details', () => {
      const enriched = [
        {
          model: makeModel({
            details: { family: 'unknown', parameter_size: '7B' },
          }),
          show: makeShow({
            details: { family: 'llama3', parameter_size: '13B' },
          }),
        },
      ]

      const result = buildOllamaModelList(enriched)
      expect(result[0].family).toBe('llama3')
      expect(result[0].parameterSize).toBe('13B')
    })

    it('should sort results alphabetically by name', () => {
      const enriched = [
        { model: makeModel({ name: 'zephyr' }), show: makeShow() },
        { model: makeModel({ name: 'alpha' }), show: makeShow() },
        { model: makeModel({ name: 'beta' }), show: makeShow() },
      ]

      const result = buildOllamaModelList(enriched)
      expect(result.map(r => r.name)).toEqual(['alpha', 'beta', 'zephyr'])
    })

    it('should return empty array when all models are filtered out', () => {
      // gpt-4:cloud is filtered by isCloudModel
      // embedding models with empty capabilities and matching patterns are filtered
      const noCapShow = {
        capabilities: [],
        details: { family: 'llama', parameter_size: '7B', quantization_level: 'Q4_0' },
        model_info: {},
      } as OllamaShowResponse

      const enriched = [
        { model: makeModel({ name: 'gpt-4:cloud' }), show: makeShow() },
        { model: makeModel({ name: 'embeddinggemma' }), show: noCapShow },
      ]

      const result = buildOllamaModelList(enriched)
      expect(result).toEqual([])
    })
  })
})
