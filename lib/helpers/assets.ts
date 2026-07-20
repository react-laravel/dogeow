const REMOTE_PROTOCOL_RE = /^(?:https?:)?\/\//

function normalizeBaseUrl(baseUrl?: string): string {
  return (baseUrl ?? '').trim().replace(/\/+$/, '')
}

export function asset(path: string): string {
  if (
    !path ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    REMOTE_PROTOCOL_RE.test(path)
  ) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_ASSET_BASE_URL)

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath
}

export function imageAsset(path: string): string {
  return asset(path.startsWith('/images/') ? path : `/images/${path.replace(/^\/+/, '')}`)
}

/**
 * Resolve a project cover while allowing an explicitly root-relative path to
 * stay on the application origin. This is useful for assets that have not
 * been mirrored to NEXT_PUBLIC_ASSET_BASE_URL.
 */
export function projectCoverAsset(path: string): string {
  if (path.startsWith('/') || REMOTE_PROTOCOL_RE.test(path)) {
    return path
  }

  return imageAsset(`/images/projects/${path}`)
}
