/** 文件变更同时影响默认列表、带筛选的列表、目录树和统计。 */
export const isCloudFileCacheKey = (key: unknown): boolean =>
  typeof key === 'string' &&
  (key === '/cloud/files' ||
    key.startsWith('/cloud/files?') ||
    key.startsWith('/cloud/files/') ||
    key === '/cloud/tree' ||
    key === '/cloud/statistics')
