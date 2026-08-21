import * as Crypto from 'expo-crypto';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { beneficiaries } from '@/db/schema';

export interface BeneficiaryRecord {
  id: string;
  name: string;
  isDefault: boolean;
}

export async function listBeneficiaries(): Promise<BeneficiaryRecord[]> {
  return db
    .select({ id: beneficiaries.id, name: beneficiaries.name, isDefault: beneficiaries.isDefault })
    .from(beneficiaries)
    .orderBy(desc(beneficiaries.lastUsedAt));
}

export async function listRecentBeneficiaries(limit = 10): Promise<string[]> {
  const rows = await db
    .select({ name: beneficiaries.name })
    .from(beneficiaries)
    .orderBy(desc(beneficiaries.lastUsedAt))
    .limit(limit);
  return rows.map((r) => r.name);
}

export async function getDefaultBeneficiaryName(): Promise<string | null> {
  const [row] = await db.select({ name: beneficiaries.name }).from(beneficiaries).where(eq(beneficiaries.isDefault, true));
  return row?.name ?? null;
}

export async function createBeneficiary(name: string): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(beneficiaries).values({ id, name: name.trim(), lastUsedAt: new Date().toISOString(), isDefault: false });
  return id;
}

/** Clears any existing default first — at most one beneficiary can be default at a time. */
export async function setDefaultBeneficiary(id: string): Promise<void> {
  await db.update(beneficiaries).set({ isDefault: false }).where(eq(beneficiaries.isDefault, true));
  await db.update(beneficiaries).set({ isDefault: true }).where(eq(beneficiaries.id, id));
}

export async function clearDefaultBeneficiary(id: string): Promise<void> {
  await db.update(beneficiaries).set({ isDefault: false }).where(eq(beneficiaries.id, id));
}
