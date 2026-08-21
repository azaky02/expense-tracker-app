import * as Crypto from 'expo-crypto';
import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, banks } from '@/db/schema';

export interface BankRecord {
  id: string;
  name: string;
  logoUri: string | null;
  isCustom: boolean;
}

export async function listBanks(): Promise<BankRecord[]> {
  return db.select().from(banks).orderBy(asc(banks.name));
}

export async function createCustomBank(name: string): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(banks).values({ id, name: name.trim(), isCustom: true });
  return id;
}

export async function renameBank(id: string, name: string): Promise<void> {
  await db.update(banks).set({ name: name.trim() }).where(eq(banks.id, id));
}

/** Only a custom bank with no accounts using it can be deleted — default/seed banks and banks
 * still referenced by an account are protected, same "app checks, not a DB constraint" style
 * used elsewhere (categories' isDefault check, etc). */
export async function deleteBank(id: string): Promise<{ deleted: boolean; reason?: 'default' | 'inUse' }> {
  const [bank] = await db.select().from(banks).where(eq(banks.id, id));
  if (!bank || !bank.isCustom) return { deleted: false, reason: 'default' };

  const inUse = await db.select().from(accounts).where(eq(accounts.bankId, id));
  if (inUse.length > 0) return { deleted: false, reason: 'inUse' };

  await db.delete(banks).where(eq(banks.id, id));
  return { deleted: true };
}
