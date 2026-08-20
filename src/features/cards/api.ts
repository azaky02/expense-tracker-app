import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { banks, cards } from '@/db/schema';
import { nextCardColor } from '@/theme/cardBrandColors';

import type { CardInput, CardRecord } from './types';

export async function listCards(): Promise<CardRecord[]> {
  const rows = await db
    .select({
      id: cards.id,
      bankId: cards.bankId,
      bankName: banks.name,
      cardType: cards.cardType,
      cardCategory: cards.cardCategory,
      nickname: cards.nickname,
      last4Digits: cards.last4Digits,
      dueDateDay: cards.dueDateDay,
      statementDateDay: cards.statementDateDay,
      creditLimit: cards.creditLimit,
      color: cards.color,
      isActive: cards.isActive,
    })
    .from(cards)
    .innerJoin(banks, eq(cards.bankId, banks.id))
    .where(eq(cards.isActive, true));
  return rows;
}

export async function getCard(id: string): Promise<CardRecord | undefined> {
  const [row] = await db
    .select({
      id: cards.id,
      bankId: cards.bankId,
      bankName: banks.name,
      cardType: cards.cardType,
      cardCategory: cards.cardCategory,
      nickname: cards.nickname,
      last4Digits: cards.last4Digits,
      dueDateDay: cards.dueDateDay,
      statementDateDay: cards.statementDateDay,
      creditLimit: cards.creditLimit,
      color: cards.color,
      isActive: cards.isActive,
    })
    .from(cards)
    .innerJoin(banks, eq(cards.bankId, banks.id))
    .where(eq(cards.id, id));
  return row;
}

export async function createCard(input: CardInput): Promise<string> {
  const id = Crypto.randomUUID();
  const existingCount = (await db.select().from(cards)).length;
  await db.insert(cards).values({
    id,
    bankId: input.bankId,
    cardType: input.cardType,
    cardCategory: input.cardCategory,
    nickname: input.nickname,
    last4Digits: input.last4Digits,
    dueDateDay: input.cardCategory === 'Credit' ? (input.dueDateDay ?? null) : null,
    statementDateDay: input.cardCategory === 'Credit' ? (input.statementDateDay ?? null) : null,
    creditLimit: input.creditLimit ?? null,
    color: nextCardColor(existingCount),
    isActive: true,
  });
  return id;
}

export async function updateCard(id: string, input: CardInput): Promise<void> {
  await db
    .update(cards)
    .set({
      bankId: input.bankId,
      cardType: input.cardType,
      cardCategory: input.cardCategory,
      nickname: input.nickname,
      last4Digits: input.last4Digits,
      dueDateDay: input.cardCategory === 'Credit' ? (input.dueDateDay ?? null) : null,
      statementDateDay: input.cardCategory === 'Credit' ? (input.statementDateDay ?? null) : null,
      creditLimit: input.creditLimit ?? null,
    })
    .where(eq(cards.id, id));
}

export async function deactivateCard(id: string): Promise<void> {
  await db.update(cards).set({ isActive: false }).where(eq(cards.id, id));
}
