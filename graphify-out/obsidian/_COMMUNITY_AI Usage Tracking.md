---
type: community
cohesion: 0.40
members: 5
---

# AI Usage Tracking

**Cohesion:** 0.40 - moderately connected
**Members:** 5 nodes

## Members
- [[aggregateUsage()]] - code - src\lib\db\ai-usage-queries.ts
- [[ai-usage-queries.ts]] - code - src\lib\db\ai-usage-queries.ts
- [[getUsageByConversation()]] - code - src\lib\db\ai-usage-queries.ts
- [[getUsageByProject()]] - code - src\lib\db\ai-usage-queries.ts
- [[recordUsage()]] - code - src\lib\db\ai-usage-queries.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Usage_Tracking
SORT file.name ASC
```
