import * as Crypto from 'expo-crypto';
import { eq, like } from 'drizzle-orm';

import { db } from '@/db';
import { people } from '@/db/schema';

import type { PersonRecord } from './types';

export async function listPeople(): Promise<PersonRecord[]> {
  return db.select({ id: people.id, name: people.name }).from(people);
}

export async function searchPeople(query: string): Promise<PersonRecord[]> {
  if (!query.trim()) return listPeople();
  return db
    .select({ id: people.id, name: people.name })
    .from(people)
    .where(like(people.name, `%${query.trim()}%`));
}

export async function getPerson(id: string): Promise<PersonRecord | undefined> {
  const [row] = await db.select({ id: people.id, name: people.name }).from(people).where(eq(people.id, id));
  return row;
}

export async function createPerson(name: string): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(people).values({ id, name: name.trim() });
  return id;
}

/** Reuses an existing person with an exact-match name, otherwise creates one. */
export async function findOrCreatePerson(name: string): Promise<string> {
  const trimmed = name.trim();
  const [existing] = await db.select().from(people).where(eq(people.name, trimmed));
  if (existing) return existing.id;
  return createPerson(trimmed);
}
