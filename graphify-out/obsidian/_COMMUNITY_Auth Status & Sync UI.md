---
type: community
cohesion: 0.33
members: 6
---

# Auth Status & Sync UI

**Cohesion:** 0.33 - loosely connected
**Members:** 6 nodes

## Members
- [[AuthStatus()]] - code - src\components\auth\AuthStatus.tsx
- [[AuthStatus.tsx]] - code - src\components\auth\AuthStatus.tsx
- [[SyncProgress()]] - code - src\components\sync\SyncProgress.tsx
- [[SyncProgress.tsx]] - code - src\components\sync\SyncProgress.tsx
- [[useAuth()]] - code - src\lib\hooks\useAuth.ts
- [[useAuth.ts]] - code - src\lib\hooks\useAuth.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth_Status_&_Sync_UI
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Auth & Sync Engine]]

## Top bridge nodes
- [[useAuth()]] - degree 4, connects to 1 community