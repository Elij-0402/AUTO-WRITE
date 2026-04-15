'use client'

// Stub for sync status icon - will be implemented in Phase 08 Plan 02 (cloud sync)
export function SyncStatusIcon() {
  return (
    <div className="flex items-center justify-center w-8 h-8 text-gray-400">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </div>
  )
}
