import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { palette } from '@/theme/palette';

import { banks, categories, meta } from './schema';
import { db } from './client';

const SEED_FLAG_KEY = 'seed-completed-v1';

const DEFAULT_BANKS = [
  'CIB',
  'بنك مصر',
  'البنك الأهلي المصري',
  'QNB الأهلي',
  'بنك الإسكندرية',
  'HSBC',
  'ADIB',
  'بنك أبوظبي الأول',
  'بنك الرياض',
  'الراجحي',
  'بنك الكويت الوطني',
  'بنك مسقط',
];

interface DefaultCategorySeed {
  name: string;
  icon: string;
  color: string;
  type: 'Expense' | 'Income';
  children?: { name: string; icon: string }[];
}

const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  {
    name: 'أكل و شرب',
    icon: '🍔',
    color: palette.teal600,
    type: 'Expense',
  },
  {
    name: 'مواصلات',
    icon: '🚗',
    color: palette.orange600,
    type: 'Expense',
    children: [
      { name: 'بنزين', icon: '⛽' },
      { name: 'مواصلات عامة', icon: '🚌' },
      { name: 'صيانة عربية', icon: '🔧' },
    ],
  },
  {
    name: 'فواتير',
    icon: '🧾',
    color: palette.grey400,
    type: 'Expense',
  },
  {
    name: 'ترفيه',
    icon: '🎬',
    color: palette.navy600,
    type: 'Expense',
  },
  {
    name: 'صحة',
    icon: '💊',
    color: palette.red500,
    type: 'Expense',
  },
  {
    name: 'أخرى',
    icon: '📦',
    color: palette.grey300,
    type: 'Expense',
  },
  {
    name: 'دخل',
    icon: '💰',
    color: palette.teal700,
    type: 'Income',
    children: [
      { name: 'راتب', icon: '🏦' },
      { name: 'دخل إضافي', icon: '➕' },
    ],
  },
];

export async function seedIfNeeded(): Promise<void> {
  const [flag] = await db.select().from(meta).where(eq(meta.key, SEED_FLAG_KEY));
  if (flag) return;

  await db.insert(banks).values(
    DEFAULT_BANKS.map((name) => ({
      id: Crypto.randomUUID(),
      name,
      isCustom: false,
    }))
  );

  for (const category of DEFAULT_CATEGORIES) {
    const parentId = Crypto.randomUUID();
    await db.insert(categories).values({
      id: parentId,
      parentCategoryId: null,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      isDefault: true,
    });

    if (category.children) {
      await db.insert(categories).values(
        category.children.map((child) => ({
          id: Crypto.randomUUID(),
          parentCategoryId: parentId,
          name: child.name,
          icon: child.icon,
          color: category.color,
          type: category.type,
          isDefault: true,
        }))
      );
    }
  }

  await db.insert(meta).values({ key: SEED_FLAG_KEY, value: 'true' });
}
