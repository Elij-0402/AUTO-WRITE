---
type: community
cohesion: 0.33
members: 7
---

# Revision DB CRUD

**Cohesion:** 0.33 - loosely connected
**Members:** 7 nodes

## Members
- [[createRevision()]] - code - src\lib\db\revisions.ts
- [[deleteRevision()]] - code - src\lib\db\revisions.ts
- [[getRevision()]] - code - src\lib\db\revisions.ts
- [[labelRevision()]] - code - src\lib\db\revisions.ts
- [[listRevisions()]] - code - src\lib\db\revisions.ts
- [[pruneRevisions()]] - code - src\lib\db\revisions.ts
- [[revisions.ts]] - code - src\lib\db\revisions.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Revision_DB_CRUD
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Auth & Sync Engine]]
- 1 edge to [[_COMMUNITY_Chapter CRUD & Word Count]]

## Top bridge nodes
- [[createRevision()]] - degree 3, connects to 1 community
- [[getRevision()]] - degree 2, connects to 1 community