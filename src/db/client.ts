import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { open, type DB } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

import * as schema from './schema';

const DB_NAME = 'expense-tracker.db';
const ENCRYPTION_KEY_STORE_KEY = 'db-encryption-key';

let dbInstance: DB | undefined;

/**
 * The encryption key is generated once and kept in the OS keychain/keystore — never in JS-visible
 * storage. Losing it means losing the database; that trade-off is intentional for NFR-6.
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE_KEY);
  if (existing) return existing;

  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await SecureStore.setItemAsync(ENCRYPTION_KEY_STORE_KEY, key);
  return key;
}

function getOpSqliteDb(): DB {
  if (!dbInstance) {
    throw new Error('op-sqlite connection not initialized — call initDb() first.');
  }
  return dbInstance;
}

export async function initDb(): Promise<void> {
  if (dbInstance) return;
  const encryptionKey = await getOrCreateEncryptionKey();
  dbInstance = open({ name: DB_NAME, encryptionKey });
}

/**
 * drizzle-orm's official `drizzle-orm/op-sqlite` driver only targets op-sqlite@2.x (an old,
 * pre-rewrite API — it imports a type that no longer exists in the modern op-sqlite package).
 * We use the generic `sqlite-proxy` driver instead and wire it to op-sqlite ourselves, which
 * keeps SQLCipher encryption while staying on current op-sqlite + drizzle-orm.
 *
 * drizzle's row mapper indexes rows positionally (`row[columnIndex]`), so we must use op-sqlite's
 * `executeRaw` (rows as `Scalar[][]`, in SELECT column order) rather than `execute` (which returns
 * rows as `{columnName: value}` objects and would silently produce undefined/misaligned fields).
 */
export const db = drizzle(async (sql, params, method) => {
  const opDb = getOpSqliteDb();
  if (method === 'run') {
    await opDb.execute(sql, params);
    return { rows: [] };
  }
  const result = await opDb.executeRaw(sql, params);
  return { rows: result.rawRows ?? [] };
}, { schema });

export type AppDatabase = typeof db;
