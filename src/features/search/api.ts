import { eq, like, or } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, categories, transactions } from '@/db/schema';
import type { TransactionListItem } from '@/features/transactions/types';

/** Simple LIKE-based search over note/beneficiary/category/account names — no schema change,
 * reads the same tables as the rest of the app. */
export async function searchTransactions(query: string): Promise<TransactionListItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const pattern = `%${trimmed}%`;

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      note: transactions.note,
      attachmentUri: transactions.attachmentUri,
      beneficiaryName: transactions.beneficiaryName,
      incomeType: transactions.incomeType,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      accountId: transactions.accountId,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      or(
        like(transactions.note, pattern),
        like(transactions.beneficiaryName, pattern),
        like(categories.name, pattern),
        like(accounts.name, pattern)
      )
    );

  return rows as TransactionListItem[];
}
