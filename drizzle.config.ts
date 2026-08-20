import type { Config } from 'drizzle-kit';

/**
 * driver: 'expo' makes drizzle-kit emit `drizzle/migrations.js` as a plain JS module
 * (SQL embedded as string literals) instead of loose .sql files, so Metro can bundle it —
 * the app has no filesystem access to read migration files at runtime. This works with any
 * drizzle SQLite driver, not just expo-sqlite; see src/db/migrate.ts for how it's applied
 * against our op-sqlite (sqlite-proxy) connection.
 */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
