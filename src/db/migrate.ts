import { eq, sql } from 'drizzle-orm';

import { db } from './client';
import { meta } from './schema';

// { journal, migrations } — one migrations[] entry per generated file, e.g.
// m0000: '<sql>--> statement-breakpoint<sql>...'. Regenerate via `npm run db:generate`.
// eslint-disable-next-line import/no-unresolved -- generated file, doesn't exist until then
import migrationsModule from '../../drizzle/migrations';

const { journal, migrations } = migrationsModule;

const APPLIED_KEY_PREFIX = 'migration-applied:';

/**
 * drizzle-orm ships a generic `migrate()` for this exact "SQL can't be read from disk at
 * runtime" problem (see drizzle-orm/expo-sqlite/migrator), but its TS signature is pinned to
 * ExpoSQLiteDatabase's *sync* dialect and won't accept our sqlite-proxy *async* db, even though
 * the underlying dialect.migrate() it calls is async-safe for either. Rather than `as any` past
 * that mismatch, this reimplements the same idea (journal + per-migration SQL, tracked so re-runs
 * are no-ops) using only public, well-typed drizzle APIs (`db.run`, `db.select`, `db.insert`)
 * against our own `meta` table instead of a parallel `__drizzle_migrations` table.
 */
export async function runMigrations(): Promise<void> {
  for (const entry of journal.entries) {
    const migrationKey = `m${entry.idx.toString().padStart(4, '0')}`;
    const migrationSql = (migrations as Record<string, string>)[migrationKey];
    if (!migrationSql) {
      throw new Error(`Missing migration SQL for journal entry ${entry.tag}`);
    }

    const appliedKey = `${APPLIED_KEY_PREFIX}${entry.tag}`;
    // On a brand-new database the `meta` table doesn't exist yet — it's created BY migration
    // 0000 itself, so this SELECT necessarily fails on first run. Treat that as "not applied"
    // rather than propagating the error; the migration below creates the table either way.
    let applied: { key: string; value: string } | undefined;
    try {
      [applied] = await db.select().from(meta).where(eq(meta.key, appliedKey));
    } catch {
      applied = undefined;
    }
    if (applied) continue;

    const statements = migrationSql.split('--> statement-breakpoint');
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      await db.run(sql.raw(statement));
    }
    await db.insert(meta).values({ key: appliedKey, value: 'true' });
  }
}
