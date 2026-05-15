import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';

export const CLIENT_DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;
export const CLIENT_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const uploadRoot = path.join(process.cwd(), 'uploads', 'client-documents');

export function sanitizeFileName(fileName: string) {
  const parsed = path.parse(fileName);
  const base = parsed.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'documento';
  const ext = parsed.ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 12);
  return `${base}${ext}`;
}

export async function saveClientDocument(file: File) {
  await mkdir(uploadRoot, { recursive: true });
  const safeName = sanitizeFileName(file.name);
  const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const absolutePath = path.join(uploadRoot, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
  return { absolutePath, safeName, sizeBytes: buffer.byteLength };
}

export function isPathInsideUploadRoot(storagePath: string) {
  const resolved = path.resolve(storagePath);
  const root = path.resolve(uploadRoot);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

export async function readClientDocument(storagePath: string) {
  if (!isPathInsideUploadRoot(storagePath)) {
    throw new Error('Ruta de documento invalida.');
  }

  return readFile(storagePath);
}
