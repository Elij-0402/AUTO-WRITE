---
type: community
cohesion: 0.09
members: 39
---

# Auth & Sync Engine

**Cohesion:** 0.09 - loosely connected
**Members:** 39 nodes

## Members
- [[AuthDropdown()]] - code - src\components\auth\AuthDropdown.tsx
- [[AuthDropdown.tsx]] - code - src\components\auth\AuthDropdown.tsx
- [[AuthenticatedLayout()]] - code - src\app\(authenticated)\layout.tsx
- [[GET()]] - code - src\app\auth\callback\route.ts
- [[SyncManager()]] - code - src\components\sync\SyncManager.tsx
- [[SyncManager.tsx]] - code - src\components\sync\SyncManager.tsx
- [[SyncStatusIcon()]] - code - src\components\sync\SyncStatusIcon.tsx
- [[SyncStatusIcon.tsx]] - code - src\components\sync\SyncStatusIcon.tsx
- [[actions.ts]] - code - src\app\auth\actions.ts
- [[clearSyncedItems()]] - code - src\lib\sync\sync-queue.ts
- [[createClient()_1]] - code - src\lib\supabase\server.ts
- [[enqueueChange()]] - code - src\lib\sync\sync-queue.ts
- [[field-mapping.ts]] - code - src\lib\sync\field-mapping.ts
- [[flushSyncQueue()]] - code - src\lib\sync\sync-engine.ts
- [[force-layout.ts]] - code - src\lib\analysis\force-layout.ts
- [[getLastSyncAt()]] - code - src\lib\sync\sync-queue.ts
- [[getPendingChanges()]] - code - src\lib\sync\sync-queue.ts
- [[getQueueDB()]] - code - src\lib\sync\sync-queue.ts
- [[incrementRetry()]] - code - src\lib\sync\sync-queue.ts
- [[layout.tsx_1]] - code - src\app\(authenticated)\layout.tsx
- [[layoutForceDirected()]] - code - src\lib\analysis\force-layout.ts
- [[mapCloudToLocal()]] - code - src\lib\sync\field-mapping.ts
- [[mapLocalToCloud()]] - code - src\lib\sync\field-mapping.ts
- [[markSynced()]] - code - src\lib\sync\sync-queue.ts
- [[performInitialSync()]] - code - src\lib\sync\sync-engine.ts
- [[resetPassword()]] - code - src\app\auth\actions.ts
- [[retryFailedSync()]] - code - src\lib\sync\sync-engine.ts
- [[route.ts]] - code - src\app\auth\callback\route.ts
- [[server.ts]] - code - src\lib\supabase\server.ts
- [[setLastSyncAt()]] - code - src\lib\sync\sync-queue.ts
- [[signIn()]] - code - src\app\auth\actions.ts
- [[signOut()]] - code - src\app\auth\actions.ts
- [[signUp()]] - code - src\app\auth\actions.ts
- [[sync-engine.ts]] - code - src\lib\sync\sync-engine.ts
- [[sync-queue.ts]] - code - src\lib\sync\sync-queue.ts
- [[syncNewProject()]] - code - src\lib\sync\sync-engine.ts
- [[triggerImmediateSync()]] - code - src\components\sync\SyncManager.tsx
- [[useSync()]] - code - src\lib\hooks\useSync.ts
- [[useSync.ts]] - code - src\lib\hooks\useSync.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_&_Sync_Engine
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Chapter CRUD & Word Count]]
- 1 edge to [[_COMMUNITY_Next.js Proxy Middleware]]
- 1 edge to [[_COMMUNITY_Revision DB CRUD]]
- 1 edge to [[_COMMUNITY_World Entry Queries]]
- 1 edge to [[_COMMUNITY_Project Layout & Word Count]]
- 1 edge to [[_COMMUNITY_Vector Embedder Math]]
- 1 edge to [[_COMMUNITY_Auth Status & Sync UI]]

## Top bridge nodes
- [[GET()]] - degree 17, connects to 6 communities
- [[createClient()_1]] - degree 12, connects to 1 community
- [[performInitialSync()]] - degree 5, connects to 1 community