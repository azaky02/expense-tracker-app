import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { notificationPreferences } from '@/db/schema';

export interface NotificationPreferenceRecord {
  key: string;
  isEnabled: boolean;
  config: string | null;
}

export async function getNotificationPreference(key: string): Promise<NotificationPreferenceRecord | undefined> {
  const [row] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.key, key));
  return row;
}

export async function listNotificationPreferences(): Promise<NotificationPreferenceRecord[]> {
  return db.select().from(notificationPreferences);
}

export async function setNotificationPreference(
  key: string,
  isEnabled: boolean,
  config?: Record<string, unknown>
): Promise<void> {
  const existing = await getNotificationPreference(key);
  const configStr = config !== undefined ? JSON.stringify(config) : (existing?.config ?? null);
  if (existing) {
    await db.update(notificationPreferences).set({ isEnabled, config: configStr }).where(eq(notificationPreferences.key, key));
  } else {
    await db.insert(notificationPreferences).values({ key, isEnabled, config: configStr });
  }
}
