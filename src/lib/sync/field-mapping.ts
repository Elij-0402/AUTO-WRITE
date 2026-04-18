/**
 * Cloud ↔ local field mapping for Supabase sync.
 *
 * Rationale: the cloud tables carry a historical mix of naming styles —
 * `user_id` (snake, RLS convention), `localUpdatedAt` (camel, quoted identifier),
 * `updated_at` / `deleted_at` (snake, Postgres default). Rather than leak that
 * detail into sync-engine via `record.updated_at || record.localUpdatedAt`
 * fallbacks sprinkled inline, the mixed-casing lives in one place here.
 *
 * Scope: this module does NOT rename cloud columns. Changing the cloud schema
 * is a separate migration. The mapper only normalizes what the client reads
 * and writes so the rest of the codebase sees canonical camelCase.
 */

export type TableName =
  | 'projectIndex'
  | 'chapters'
  | 'worldEntries'
  | 'relations'
  | 'messages'
  | 'conversations'

/**
 * Convert a cloud record (mixed casing) into a canonical camelCase object.
 * Unknown fields pass through unchanged so future columns don't require a
 * mapper update just to round-trip.
 */
export function mapCloudToLocal(
  table: TableName,
  cloud: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...cloud }

  // updatedAt: two possible sources on the cloud, both historical:
  //   - `updated_at` (Postgres default)
  //   - `localUpdatedAt` (quoted camel column used by older writes)
  // Prefer the explicit one when both are present.
  if (out.updatedAt === undefined) {
    out.updatedAt = cloud.updated_at ?? cloud.localUpdatedAt
  }
  delete out.updated_at
  delete out.localUpdatedAt

  // createdAt: snake version exists on some tables, camel on others.
  if (out.createdAt === undefined) {
    out.createdAt = cloud.created_at
  }
  delete out.created_at

  // deletedAt: same pattern. Null is a valid value; preserve it.
  if (out.deletedAt === undefined) {
    out.deletedAt = cloud.deleted_at ?? null
  }
  delete out.deleted_at

  // user_id is cloud-only; strip from local view.
  delete out.user_id

  // Per-table: projectId historically stored as projectId (camel), kept as-is.
  // Kept intentionally unmapped so a future Supabase schema change surfaces
  // here first.
  void table
  return out
}

/**
 * Convert a local record into the cloud-wire format.
 * The cloud schema keeps its existing (mixed) casing — this function only
 * adds the required RLS field and the `localUpdatedAt` the sync engine uses
 * for LWW conflict resolution.
 */
export function mapLocalToCloud(
  table: TableName,
  local: Record<string, unknown>,
  userId: string,
  localUpdatedAt: number
): Record<string, unknown> {
  void table
  const { id, ...rest } = local
  return {
    ...rest,
    id,
    user_id: userId,
    localUpdatedAt,
  }
}
