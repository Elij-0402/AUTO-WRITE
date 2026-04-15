/**
 * Conflict resolver for sync operations.
 * Per D-33: Last-Write-Wins (LWW) — silent, no user prompt.
 */

export interface ConflictResolution {
  strategy: 'last-write-wins'
  localTimestamp: number
  remoteTimestamp: number
  resolvedWith: 'local' | 'remote'
}

/**
 * Resolve a conflict between local and remote versions.
 * Always returns the newer version (Last-Write-Wins).
 */
export function resolveConflict(
  localUpdatedAt: number,
  remoteUpdatedAt: number
): ConflictResolution {
  if (localUpdatedAt >= remoteUpdatedAt) {
    return {
      strategy: 'last-write-wins',
      localTimestamp: localUpdatedAt,
      remoteTimestamp: remoteUpdatedAt,
      resolvedWith: 'local',
    }
  }
  
  return {
    strategy: 'last-write-wins',
    localTimestamp: localUpdatedAt,
    remoteTimestamp: remoteUpdatedAt,
    resolvedWith: 'remote',
  }
}

/**
 * Check if a record should be synced based on timestamps.
 * Returns true if local is newer (should push) or equal (can push).
 */
export function shouldPushToCloud(localUpdatedAt: number, remoteUpdatedAt: number | null): boolean {
  if (remoteUpdatedAt === null) {
    return true // No remote version, push local
  }
  return localUpdatedAt >= remoteUpdatedAt
}

/**
 * Check if a record should be pulled from cloud.
 * Returns true if remote is newer (should pull) or equal.
 */
export function shouldPullFromCloud(localUpdatedAt: number | null, remoteUpdatedAt: number): boolean {
  if (localUpdatedAt === null) {
    return true // No local version, pull remote
  }
  return remoteUpdatedAt > localUpdatedAt
}