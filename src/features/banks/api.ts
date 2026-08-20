import * as Crypto from 'expo-crypto';
import { asc } from 'drizzle-orm';

import { db } from '@/db';
import { banks } from '@/db/schema';

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
