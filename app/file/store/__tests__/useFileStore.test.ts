import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useFileStore from '../useFileStore'

const resetStore = () => {
  useFileStore.setState({
    currentView: 'grid',
    searchQuery: '',
    currentFolderId: null,
    selectedFiles: [],
    sortField: 'created_at',
    sortDirection: 'desc',
  })
}

describe('useFileStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useFileStore.getState()
      expect(state.currentView).toBe('grid')
      expect(state.searchQuery).toBe('')
      expect(state.currentFolderId).toBeNull()
      expect(state.selectedFiles).toEqual([])
      expect(state.sortField).toBe('created_at')
      expect(state.sortDirection).toBe('desc')
    })
  })

  describe('setCurrentView', () => {
    it('should change current view', () => {
      useFileStore.getState().setCurrentView('list')
      expect(useFileStore.getState().currentView).toBe('list')
    })

    it('should switch between views', () => {
      const store = useFileStore.getState()
      act(() => {
        store.setCurrentView('tree')
      })
      expect(useFileStore.getState().currentView).toBe('tree')
      act(() => {
        store.setCurrentView('grid')
      })
      expect(useFileStore.getState().currentView).toBe('grid')
    })
  })

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      useFileStore.getState().setSearchQuery('document')
      expect(useFileStore.getState().searchQuery).toBe('document')
    })

    it('should clear search query', () => {
      const store = useFileStore.getState()
      act(() => {
        store.setSearchQuery('test')
      })
      expect(useFileStore.getState().searchQuery).toBe('test')
      act(() => {
        store.setSearchQuery('')
      })
      expect(useFileStore.getState().searchQuery).toBe('')
    })
  })

  describe('navigateToFolder', () => {
    it('should navigate to a folder', () => {
      useFileStore.getState().navigateToFolder(5)
      expect(useFileStore.getState().currentFolderId).toBe(5)
    })

    it('should navigate to root when given null', () => {
      const store = useFileStore.getState()
      act(() => {
        store.navigateToFolder(5)
      })
      expect(useFileStore.getState().currentFolderId).toBe(5)
      act(() => {
        store.navigateToFolder(null)
      })
      expect(useFileStore.getState().currentFolderId).toBeNull()
    })

    it('should clear selected files when navigating', () => {
      const store = useFileStore.getState()
      act(() => {
        store.setSelectedFiles([1, 2, 3])
        store.navigateToFolder(10)
      })
      expect(useFileStore.getState().selectedFiles).toEqual([])
      expect(useFileStore.getState().currentFolderId).toBe(10)
    })
  })

  describe('setSelectedFiles', () => {
    it('should set selected files', () => {
      useFileStore.getState().setSelectedFiles([1, 2, 3])
      expect(useFileStore.getState().selectedFiles).toEqual([1, 2, 3])
    })

    it('should clear selection with empty array', () => {
      const store = useFileStore.getState()
      act(() => {
        store.setSelectedFiles([1, 2])
      })
      expect(useFileStore.getState().selectedFiles).toEqual([1, 2])
      act(() => {
        store.setSelectedFiles([])
      })
      expect(useFileStore.getState().selectedFiles).toEqual([])
    })
  })

  describe('handleSort', () => {
    it('should sort ascending when changing field', () => {
      useFileStore.getState().handleSort('name')
      const state = useFileStore.getState()
      expect(state.sortField).toBe('name')
      expect(state.sortDirection).toBe('asc')
    })

    it('should toggle direction when sorting same field', () => {
      const store = useFileStore.getState()
      // Initial is desc for created_at
      expect(useFileStore.getState().sortDirection).toBe('desc')

      act(() => {
        store.handleSort('name')
      })
      expect(useFileStore.getState().sortDirection).toBe('asc')

      act(() => {
        store.handleSort('name')
      })
      expect(useFileStore.getState().sortDirection).toBe('desc')
    })

    it('should reset to asc when changing to different field', () => {
      const store = useFileStore.getState()
      act(() => {
        store.handleSort('name')
      })
      expect(useFileStore.getState().sortDirection).toBe('asc')

      act(() => {
        store.handleSort('size')
      })
      expect(useFileStore.getState().sortField).toBe('size')
      expect(useFileStore.getState().sortDirection).toBe('asc')
    })
  })
})
