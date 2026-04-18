---
type: "query"
date: "2026-04-18T12:38:40.377811+00:00"
question: "Are the 16 INFERRED edges on GET() real, or AST collapse?"
contributor: "graphify"
---

# Q: Are the 16 INFERRED edges on GET() real, or AST collapse?

## Answer

The 16 INFERRED edges on route_get are mostly AST collapse artifacts. route_get (src app auth callback route.ts L4) has 16 INFERRED + 1 EXTRACTED = 17 edges total, 94% INFERRED. EXTRACTED (1): src_app_auth_callback_route_ts. INFERRED auth-cluster (4): proxy_proxy, actions_signup, actions_signin, actions_resetpassword — plausible since same auth module. INFERRED cross-module (12): sync_engine_syncnewproject, indexer_indexworldentries, chapter_queries_duplicatechapter, revisions_getrevision, world_entry_queries_getworldentrybyid, sync_queue_marksynced, sync_queue_getlastsyncat, sync_queue_incrementretry, use_word_count_updatetodaywordcount, ai_chat_panel_handlecheckduplicate, force_layout_layoutforcedirected, server_createclient — all FALSE. Same artifact affects server_createclient (91.7% INFERRED) and project_db_createprojectdb (83.3% INFERRED). Real cross-module hubs are: src_components_workspace_ai_chat_panel_tsx (bc=0.0560, 100% EXTRACTED), use_world_entries (bc=0.0287), src_lib_db_chapter_queries_ts (bc=0.0184).