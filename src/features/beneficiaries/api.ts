import { desc } from 'drizzle-orm';

import { db } from '@/db';
import { beneficiaries } from '@/db/schema';

export async function listRecentBeneficiaries(limit = 10): Promise<string[]> {
  const rows = await db
    .select({ name: beneficiaries.name })
    .from(beneficiaries)
    .orderBy(desc(beneficiaries.lastUsedAt))
    .limit(limit);
  return rows.map((r) => r.name);
}
