import * as FileSystem from 'expo-file-system/legacy';

import { db } from '@/db';
import { banks, cards, categories, categoryBudgets, beneficiaries, notificationPreferences, transactions } from '@/db/schema';

const BACKUP_VERSION = 1;

interface BackupFile {
  version: number;
  exportedAt: string;
  data: {
    banks: (typeof banks.$inferSelect)[];
    categories: (typeof categories.$inferSelect)[];
    cards: (typeof cards.$inferSelect)[];
    beneficiaries: (typeof beneficiaries.$inferSelect)[];
    transactions: (typeof transactions.$inferSelect)[];
    categoryBudgets: (typeof categoryBudgets.$inferSelect)[];
    notificationPreferences: (typeof notificationPreferences.$inferSelect)[];
  };
}

const BACKUP_FILE_NAME = 'expense-tracker-backup.json';

/** Backs up DB rows only — attachment photos on disk are not included in this Phase 1 backup. */
export async function exportBackup(): Promise<string> {
  const backup: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      banks: await db.select().from(banks),
      categories: await db.select().from(categories),
      cards: await db.select().from(cards),
      beneficiaries: await db.select().from(beneficiaries),
      transactions: await db.select().from(transactions),
      categoryBudgets: await db.select().from(categoryBudgets),
      notificationPreferences: await db.select().from(notificationPreferences),
    },
  };

  const uri = `${FileSystem.cacheDirectory}${BACKUP_FILE_NAME}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
  return uri;
}

export async function importBackup(fileUri: string): Promise<void> {
  const raw = await FileSystem.readAsStringAsync(fileUri);
  const backup = JSON.parse(raw) as BackupFile;
  if (backup.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${backup.version}`);
  }

  // Delete children before parents, then insert parents before children.
  await db.delete(transactions);
  await db.delete(categoryBudgets);
  await db.delete(cards);
  await db.delete(categories);
  await db.delete(banks);
  await db.delete(beneficiaries);
  await db.delete(notificationPreferences);

  if (backup.data.banks.length) await db.insert(banks).values(backup.data.banks);
  if (backup.data.categories.length) await db.insert(categories).values(backup.data.categories);
  if (backup.data.cards.length) await db.insert(cards).values(backup.data.cards);
  if (backup.data.beneficiaries.length) await db.insert(beneficiaries).values(backup.data.beneficiaries);
  if (backup.data.transactions.length) await db.insert(transactions).values(backup.data.transactions);
  if (backup.data.categoryBudgets.length) await db.insert(categoryBudgets).values(backup.data.categoryBudgets);
  if (backup.data.notificationPreferences.length) {
    await db.insert(notificationPreferences).values(backup.data.notificationPreferences);
  }
}
