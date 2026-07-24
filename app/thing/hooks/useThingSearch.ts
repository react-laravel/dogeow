import { useState, useCallback, useEffect } from 'react'

interface UseThingSearchReturn {
  searchTerm: string
  setSearchTerm: (term: string) => void
  handleSearch: (term: string) => void
  isSearching: boolean
}

function syncSearchToUrl(term: string): void {
  const url = new URL(window.location.href)
  if (term) {
    url.searchParams.set('search', term)
  } else {
    url.searchParams.delete('search')
  }
  window.history.replaceState({}, '', url)
}

/**
 * Search term + URL sync for Thing list.
 * List fetching is owned by the page via useItems({ search }).
 */
export function useThingSearch(): UseThingSearchReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback((term: string) => {
    setIsSearching(true)
    setSearchTerm(term)
    syncSearchToUrl(term)
    // SWR revalidates when the page query key changes; clear local flag next tick
    queueMicrotask(() => setIsSearching(false))
  }, [])

  useEffect(() => {
    const handleCustomSearch = (event: CustomEvent<{ searchTerm?: string }>) => {
      const newSearchTerm = event.detail?.searchTerm ?? ''
      const normalizedCurrent = String(searchTerm ?? '').trim()
      const normalizedNew = String(newSearchTerm ?? '').trim()

      if (normalizedCurrent !== normalizedNew) {
        handleSearch(newSearchTerm)
      }
    }

    document.addEventListener('thing-search', handleCustomSearch as EventListener)
    return () => {
      document.removeEventListener('thing-search', handleCustomSearch as EventListener)
    }
  }, [searchTerm, handleSearch])

  useEffect(() => {
    const handleUrlChange = () => {
      const search = new URLSearchParams(window.location.search).get('search') ?? ''
      if (search !== searchTerm) {
        setSearchTerm(search)
      }
    }

    window.addEventListener('popstate', handleUrlChange)
    return () => {
      window.removeEventListener('popstate', handleUrlChange)
    }
  }, [searchTerm])

  return {
    searchTerm,
    setSearchTerm,
    handleSearch,
    isSearching,
  }
}
