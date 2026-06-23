import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useEditorStore } from '../editorStore'

describe('useEditorStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useEditorStore.getState()
    act(() => {
      store.setDirty(false)
      store.setSaveDraft(undefined)
    })
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useEditorStore.getState()
      expect(state.isDirty).toBe(false)
      expect(state.saveDraft).toBeUndefined()
    })
  })

  describe('setDirty', () => {
    it('should set dirty to true', () => {
      useEditorStore.getState().setDirty(true)
      expect(useEditorStore.getState().isDirty).toBe(true)
    })

    it('should set dirty to false', () => {
      const store = useEditorStore.getState()
      act(() => {
        store.setDirty(true)
      })
      expect(useEditorStore.getState().isDirty).toBe(true)
      act(() => {
        store.setDirty(false)
      })
      expect(useEditorStore.getState().isDirty).toBe(false)
    })
  })

  describe('setSaveDraft', () => {
    it('should set save draft function', () => {
      const mockFn = () => Promise.resolve()
      useEditorStore.getState().setSaveDraft(mockFn)
      expect(useEditorStore.getState().saveDraft).toBe(mockFn)
    })

    it('should clear save draft when set to undefined', () => {
      const store = useEditorStore.getState()
      act(() => {
        store.setSaveDraft(() => Promise.resolve())
      })
      expect(useEditorStore.getState().saveDraft).toBeDefined()

      act(() => {
        store.setSaveDraft(undefined)
      })
      expect(useEditorStore.getState().saveDraft).toBeUndefined()
    })
  })
})
