---
type: community
cohesion: 0.29
members: 8
---

# Project Layout & Word Count

**Cohesion:** 0.29 - loosely connected
**Members:** 8 nodes

## Members
- [[ProjectLayout()]] - code - src\app\projects\[id]\layout.tsx
- [[layout.tsx_2]] - code - src\app\projects\[id]\layout.tsx
- [[updateTodayWordCount()]] - code - src\lib\hooks\use-word-count.ts
- [[use-projects.ts]] - code - src\lib\hooks\use-projects.ts
- [[use-word-count.ts]] - code - src\lib\hooks\use-word-count.ts
- [[useProjects()]] - code - src\lib\hooks\use-projects.ts
- [[useTodayWordCount()]] - code - src\lib\hooks\use-word-count.ts
- [[useTotalWordCount()]] - code - src\lib\hooks\use-word-count.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Project_Layout_&_Word_Count
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Auth & Sync Engine]]

## Top bridge nodes
- [[updateTodayWordCount()]] - degree 2, connects to 1 community