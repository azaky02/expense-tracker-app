import * as Crypto from 'expo-crypto';
import { eq, ne, sum } from 'drizzle-orm';

import { db } from '@/db';
import { custodyRecords, custodySettlements, people } from '@/db/schema';

import type { CustodyRecordInput, CustodyRecordRecord, CustodySettlementRecord } from './types';

const selection = {
  id: custodyRecords.id,
  personId: custodyRecords.personId,
  personName: people.name,
  reason: custodyRecords.reason,
  originalAmount: custodyRecords.originalAmount,
  remainingAmount: custodyRecords.remainingAmount,
  status: custodyRecords.status,
  receivedDate: custodyRecords.receivedDate,
};

export async function listOpenCustodyRecords(): Promise<CustodyRecordRecord[]> {
  const rows = await db
    .select(selection)
    .from(custodyRecords)
    .innerJoin(people, eq(custodyRecords.personId, people.id))
    .where(ne(custodyRecords.status, 'Closed'));
  return rows as CustodyRecordRecord[];
}

export async function getCustodyRecord(id: string): Promise<CustodyRecordRecord | undefined> {
  const [row] = await db
    .select(selection)
    .from(custodyRecords)
    .innerJoin(people, eq(custodyRecords.personId, people.id))
    .where(eq(custodyRecords.id, id));
  return row as CustodyRecordRecord | undefined;
}

export async function listSettlements(custodyRecordId: string): Promise<CustodySettlementRecord[]> {
  return db
    .select({
      id: custodySettlements.id,
      custodyRecordId: custodySettlements.custodyRecordId,
      amount: custodySettlements.amount,
      date: custodySettlements.date,
      note: custodySettlements.note,
    })
    .from(custodySettlements)
    .where(eq(custodySettlements.custodyRecordId, custodyRecordId));
}

export async function createCustodyRecord(input: CustodyRecordInput): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(custodyRecords).values({
    id,
    personId: input.personId,
    reason: input.reason ?? null,
    originalAmount: input.originalAmount,
    remainingAmount: input.originalAmount,
    status: 'Open',
    receivedDate: input.receivedDate,
  });
  return id;
}

/** Records a full/partial return and recomputes remainingAmount + status from the settlement history. */
export async function settleCustody(custodyRecordId: string, amount: number, date: string, note?: string | null): Promise<void> {
  await db.insert(custodySettlements).values({
    id: Crypto.randomUUID(),
    custodyRecordId,
    amount,
    date,
    note: note ?? null,
  });

  const [record] = await db.select().from(custodyRecords).where(eq(custodyRecords.id, custodyRecordId));
  if (!record) return;

  const [totalRow] = await db
    .select({ total: sum(custodySettlements.amount) })
    .from(custodySettlements)
    .where(eq(custodySettlements.custodyRecordId, custodyRecordId));
  const totalSettled = Number(totalRow?.total ?? 0);
  const remaining = Math.max(0, record.originalAmount - totalSettled);
  const status = remaining <= 0 ? 'Closed' : remaining < record.originalAmount ? 'PartiallyReturned' : 'Open';

  await db.update(custodyRecords).set({ remainingAmount: remaining, status }).where(eq(custodyRecords.id, custodyRecordId));
}

/** Corrects reason/amount for a still-fully-open record (no settlements recorded yet) — adjusts
 * remainingAmount to match, since it must always equal originalAmount minus settlements. */
export async function updateCustodyRecord(id: string, input: { reason?: string | null; originalAmount: number }): Promise<void> {
  await db
    .update(custodyRecords)
    .set({ reason: input.reason ?? null, originalAmount: input.originalAmount, remainingAmount: input.originalAmount })
    .where(eq(custodyRecords.id, id));
}

/** Only removable while still fully open (no settlements yet) — once any return is recorded, the
 * record must stay for history, matching how transactions/goals are only soft-deactivated once
 * they have real activity attached. */
export async function deleteCustodyRecord(id: string): Promise<{ deleted: boolean }> {
  const [record] = await db.select().from(custodyRecords).where(eq(custodyRecords.id, id));
  if (!record || record.status !== 'Open' || record.remainingAmount !== record.originalAmount) {
    return { deleted: false };
  }
  await db.delete(custodyRecords).where(eq(custodyRecords.id, id));
  return { deleted: true };
}

/** Sum of remainingAmount across all open/partially-returned records — the "أموال تحت الأمانة" total. */
export async function getTotalCustodyBalance(): Promise<number> {
  const [row] = await db
    .select({ total: sum(custodyRecords.remainingAmount) })
    .from(custodyRecords)
    .where(ne(custodyRecords.status, 'Closed'));
  return Number(row?.total ?? 0);
}
