/**
 * Error thrown when lock acquisition fails
 */
export class LockAcquisitionError extends Error {
  public readonly resource: string
  public readonly attempts: number

  constructor(resource: string, attempts: number, message?: string) {
    super(message ?? `Failed to acquire lock for resource: ${resource} after ${attempts} attempts`)
    this.name = 'LockAcquisitionError'
    this.resource = resource
    this.attempts = attempts
  }
}

/**
 * Error thrown when lock release fails
 */
export class LockReleaseError extends Error {
  public readonly resource: string

  constructor(resource: string, message?: string) {
    super(message ?? `Failed to release lock for resource: ${resource}`)
    this.name = 'LockReleaseError'
    this.resource = resource
  }
}
