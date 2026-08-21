import * as Crypto from 'expo-crypto';
import { alias } from 'drizzle-orm/sqlite-core';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, transfers } from '@/db/schema';

import type { TransferInput, TransferRecord } from './types';

const fromAccounts = alias(accounts, 'from_accounts');
const toAccounts = alias(accounts, 'to_accounts');

export async function listTransfers(): Promise<TransferRecord[]> {
  const rows = await db
    .select({
      id: transfers.id,
      fromAccountId: transfers.fromAccountId,
      fromAccountName: fromAccounts.name,
      toAccountId: transfers.toAccountId,
      toAccountName: toAccounts.name,
      amount: transfers.amount,
      date: transfers.date,
      note: transfers.note,
    })
    .from(transfers)
    .innerJoin(fromAccounts, eq(transfers.fromAccountId, fromAccounts.id))
    .innerJoin(toAccounts, eq(transfers.toAccountId, toAccounts.id))
    .orderBy(desc(transfers.date));
  return rows;
}

export async function createTransfer(input: TransferInput): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(transfers).values({
    id,
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount: input.amount,
    date: input.date,
    note: input.note ?? null,
  });
  return id;
}
