---
type: community
cohesion: 0.36
members: 8
---

# AI Client Surface

**Cohesion:** 0.36 - loosely connected
**Members:** 8 nodes

## Members
- [[AIEvent union stream]] - document - docs/AI-LAYER.md
- [[OpenAI-compatible regex fallback]] - document - docs/AI-LAYER.md
- [[Provider-agnostic design goal]] - document - docs/AI-LAYER.md
- [[Tool-use suggestion cards]] - document - README.md
- [[report_contradiction tool]] - document - docs/AI-LAYER.md
- [[streamChat() entry point]] - document - docs/AI-LAYER.md
- [[suggest_entry tool]] - document - docs/AI-LAYER.md
- [[suggest_relation tool]] - document - docs/AI-LAYER.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Client_Surface
SORT file.name ASC
```
