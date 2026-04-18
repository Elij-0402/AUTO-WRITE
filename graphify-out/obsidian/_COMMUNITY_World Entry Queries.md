---
type: community
cohesion: 0.20
members: 10
---

# World Entry Queries

**Cohesion:** 0.20 - loosely connected
**Members:** 10 nodes

## Members
- [[addWorldEntry()]] - code - src\lib\db\world-entry-queries.ts
- [[getEntriesByTypeForContext()]] - code - src\lib\db\world-entry-queries.ts
- [[getWorldEntries()]] - code - src\lib\db\world-entry-queries.ts
- [[getWorldEntryById()]] - code - src\lib\db\world-entry-queries.ts
- [[queryEntriesByKeyword()]] - code - src\lib\db\world-entry-queries.ts
- [[renameWorldEntry()]] - code - src\lib\db\world-entry-queries.ts
- [[searchWorldEntries()]] - code - src\lib\db\world-entry-queries.ts
- [[softDeleteWorldEntry()]] - code - src\lib\db\world-entry-queries.ts
- [[updateWorldEntryFields()]] - code - src\lib\db\world-entry-queries.ts
- [[world-entry-queries.ts]] - code - src\lib\db\world-entry-queries.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/World_Entry_Queries
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Auth & Sync Engine]]

## Top bridge nodes
- [[getWorldEntryById()]] - degree 2, connects to 1 community