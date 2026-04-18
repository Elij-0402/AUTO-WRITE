---
type: community
cohesion: 0.09
members: 30
---

# Chapter CRUD & Word Count

**Cohesion:** 0.09 - loosely connected
**Members:** 30 nodes

## Members
- [[.constructor()]] - code - src\lib\db\project-db.ts
- [[InkForgeProjectDB]] - code - src\lib\db\project-db.ts
- [[__resetProjectDBCache()]] - code - src\lib\db\project-db.ts
- [[addChapter()]] - code - src\lib\db\chapter-queries.ts
- [[chapter-queries.ts]] - code - src\lib\db\chapter-queries.ts
- [[chapter-sidebar.tsx]] - code - src\components\chapter\chapter-sidebar.tsx
- [[computeWordCount()]] - code - src\lib\db\chapter-queries.ts
- [[createProjectDB()]] - code - src\lib\db\project-db.ts
- [[docx-export.ts]] - code - src\lib\export\docx-export.ts
- [[downloadBlob()]] - code - src\lib\export\markdown-export.ts
- [[duplicateChapter()]] - code - src\lib\db\chapter-queries.ts
- [[epub-export.ts]] - code - src\lib\export\epub-export.ts
- [[exportToDocx()]] - code - src\lib\export\docx-export.ts
- [[exportToEpub()]] - code - src\lib\export\epub-export.ts
- [[exportToMarkdown()]] - code - src\lib\export\markdown-export.ts
- [[extractTextFromContent()]] - code - src\lib\db\chapter-queries.ts
- [[extractTextFromNode()]] - code - src\lib\db\chapter-queries.ts
- [[getChapterNumber()]] - code - src\lib\db\chapter-queries.ts
- [[getChapters()]] - code - src\lib\db\chapter-queries.ts
- [[handleCheckDuplicate()]] - code - src\components\workspace\ai-chat-panel.tsx
- [[handleCreateChapter()]] - code - src\components\chapter\chapter-sidebar.tsx
- [[handleDeleteConfirm()]] - code - src\components\chapter\chapter-sidebar.tsx
- [[markdown-export.ts]] - code - src\lib\export\markdown-export.ts
- [[project-db.ts]] - code - src\lib\db\project-db.ts
- [[renameChapter()]] - code - src\lib\db\chapter-queries.ts
- [[reorderChapters()]] - code - src\lib\db\chapter-queries.ts
- [[softDeleteChapter()]] - code - src\lib\db\chapter-queries.ts
- [[updateChapterContent()]] - code - src\lib\db\chapter-queries.ts
- [[updateChapterStatus()]] - code - src\lib\db\chapter-queries.ts
- [[updateOutlineFields()]] - code - src\lib\db\chapter-queries.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Chapter_CRUD_&_Word_Count
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Auth & Sync Engine]]
- 1 edge to [[_COMMUNITY_Suggestion Adoption Flow]]
- 1 edge to [[_COMMUNITY_Revision DB CRUD]]
- 1 edge to [[_COMMUNITY_ProseMirror → Markdown]]

## Top bridge nodes
- [[handleCheckDuplicate()]] - degree 3, connects to 2 communities
- [[exportToMarkdown()]] - degree 6, connects to 1 community
- [[createProjectDB()]] - degree 6, connects to 1 community
- [[computeWordCount()]] - degree 4, connects to 1 community
- [[duplicateChapter()]] - degree 2, connects to 1 community