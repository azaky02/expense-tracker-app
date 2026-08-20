export { db } from './client';
export * as schema from './schema';

import { initDb } from './client';
import { runMigrations } from './migrate';
import { seedIfNeeded } from './seed';

export async function bootstrapDb(): Promise<void> {
  await initDb();
  await runMigrations();
  await seedIfNeeded();
}
