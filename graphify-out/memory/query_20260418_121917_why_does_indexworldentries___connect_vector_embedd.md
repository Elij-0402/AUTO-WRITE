---
type: "query"
date: "2026-04-18T12:19:17.483652+00:00"
question: "Why does indexWorldEntries() connect Vector Embedder Math to Auth & Sync Engine?"
contributor: "graphify"
source_nodes: ["indexer_indexworldentries", "hashgramembedder_hashgramembedder", "vector_store_listembeddings", "vector_store_deleteembeddingsbysource", "vector_store_putembeddings", "indexer_entrysignature", "sync_engine_flushsyncqueue", "project_db_createprojectdb"]
---

# Q: Why does indexWorldEntries() connect Vector Embedder Math to Auth & Sync Engine?

## Answer

The bridge claim is a measurement artifact, not a real connection. indexWorldEntries() has 6 real edges and all of them stay inside src/lib/rag/: entrySignature (same file), listEmbeddings / deleteEmbeddingsBySource / putEmbeddings (vector-store.ts), embed (HashGramEmbedder), searchRelevantEntries. It has zero edges into sync-engine.ts, sync-queue.ts, flushSyncQueue, markSynced, mapLocalToCloud, or any Supabase node. The betweenness centrality of 0.039 was inflated by AST-collapse on GET() (every Next.js route.ts exports a GET, the extractor merged them all into one phantom node) and createClient() (every Supabase module re-exports it). Paths like 'indexWorldEntries -> GET -> getLastSyncAt -> flushSyncQueue' exist in the graph but not in the real code. The true architectural story: RAG and Sync are cleanly decoupled; they both touch the project Dexie DB through createProjectDB() in src/lib/db/project-db.ts, but no function in RAG calls any function in Sync or vice versa. createProjectDB() is the real cross-layer hub, not indexWorldEntries().

## Source Nodes

- indexer_indexworldentries
- hashgramembedder_hashgramembedder
- vector_store_listembeddings
- vector_store_deleteembeddingsbysource
- vector_store_putembeddings
- indexer_entrysignature
- sync_engine_flushsyncqueue
- project_db_createprojectdb