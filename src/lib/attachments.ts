import * as Crypto from 'expo-crypto';
// Using the legacy Promise-based API deliberately — it's the well-documented, stable surface;
// the new File/Directory class API in expo-file-system@57 wasn't worth the risk to hand-verify here.
import * as FileSystem from 'expo-file-system/legacy';

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}attachments/`;

async function ensureAttachmentsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
  }
}

/** Copies a picked image (camera/gallery temp path) into persistent app storage. One attachment
 * max per transaction — callers should deleteAttachment() the old one first when replacing. */
export async function persistAttachment(pickedUri: string): Promise<string> {
  await ensureAttachmentsDir();
  const extension = pickedUri.split('.').pop() ?? 'jpg';
  const destination = `${ATTACHMENTS_DIR}${Crypto.randomUUID()}.${extension}`;
  await FileSystem.copyAsync({ from: pickedUri, to: destination });
  return destination;
}

export async function deleteAttachment(uri: string | null | undefined): Promise<void> {
  if (!uri) return;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
