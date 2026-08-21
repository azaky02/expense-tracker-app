import * as FileSystem from 'expo-file-system/legacy';

import { db } from '@/db';
import {
  accounts,
  banks,
  beneficiaries,
  categories,
  categoryBudgets,
  custodyRecords,
  custodySettlements,
  goals,
  incomeDetails,
  notificationPreferences,
  people,
  recurringRules,
  transactions,
  transfers,
} from '@/db/schema';

const BACKUP_VERSION = 3;

interface BackupFile {
  version: number;
  exportedAt: string;
  data: {
    banks: (typeof banks.$inferSelect)[];
    categories: (typeof categories.$inferSelect)[];
    accounts: (typeof accounts.$inferSelect)[];
    beneficiaries: (typeof beneficiaries.$inferSelect)[];
    people: (typeof people.$inferSelect)[];
    transactions: (typeof transactions.$inferSelect)[];
    incomeDetails: (typeof incomeDetails.$inferSelect)[];
    custodyRecords: (typeof custodyRecords.$inferSelect)[];
    custodySettlements: (typeof custodySettlements.$inferSelect)[];
    transfers: (typeof transfers.$inferSelect)[];
    recurringRules: (typeof recurringRules.$inferSelect)[];
    goals: (typeof goals.$inferSelect)[];
    categoryBudgets: (typeof categoryBudgets.$inferSelect)[];
    notificationPreferences: (typeof notificationPreferences.$inferSelect)[];
  };
}

const BACKUP_FILE_NAME = 'expense-tracker-backup.json';

/** Backs up DB rows only — attachment photos on disk are not included in this backup. */
export async function exportBackup(): Promise<string> {
  const backup: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      banks: await db.select().from(banks),
      categories: await db.select().from(categories),
      accounts: await db.select().from(accounts),
      beneficiaries: await db.select().from(beneficiaries),
      people: await db.select().from(people),
      transactions: await db.select().from(transactions),
      incomeDetails: await db.select().from(incomeDetails),
      custodyRecords: await db.select().from(custodyRecords),
      custodySettlements: await db.select().from(custodySettlements),
      transfers: await db.select().from(transfers),
      recurringRules: await db.select().from(recurringRules),
      goals: await db.select().from(goals),
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
  await db.delete(custodySettlements);
  await db.delete(custodyRecords);
  await db.delete(incomeDetails);
  await db.delete(transfers);
  await db.delete(recurringRules);
  await db.delete(goals);
  await db.delete(transactions);
  await db.delete(categoryBudgets);
  await db.delete(accounts);
  await db.delete(categories);
  await db.delete(banks);
  await db.delete(beneficiaries);
  await db.delete(people);
  await db.delete(notificationPreferences);

  if (backup.data.banks.length) await db.insert(banks).values(backup.data.banks);
  if (backup.data.categories.length) await db.insert(categories).values(backup.data.categories);
  if (backup.data.accounts.length) await db.insert(accounts).values(backup.data.accounts);
  if (backup.data.beneficiaries.length) await db.insert(beneficiaries).values(backup.data.beneficiaries);
  if (backup.data.people.length) await db.insert(people).values(backup.data.people);
  if (backup.data.transactions.length) await db.insert(transactions).values(backup.data.transactions);
  if (backup.data.incomeDetails.length) await db.insert(incomeDetails).values(backup.data.incomeDetails);
  if (backup.data.custodyRecords.length) await db.insert(custodyRecords).values(backup.data.custodyRecords);
  if (backup.data.custodySettlements.length) await db.insert(custodySettlements).values(backup.data.custodySettlements);
  if (backup.data.transfers.length) await db.insert(transfers).values(backup.data.transfers);
  if (backup.data.recurringRules.length) await db.insert(recurringRules).values(backup.data.recurringRules);
  if (backup.data.goals.length) await db.insert(goals).values(backup.data.goals);
  if (backup.data.categoryBudgets.length) await db.insert(categoryBudgets).values(backup.data.categoryBudgets);
  if (backup.data.notificationPreferences.length) {
    await db.insert(notificationPreferences).values(backup.data.notificationPreferences);
  }
}
