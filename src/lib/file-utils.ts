import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), "uploads")

export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  await ensureUploadDir()
  const filePath = path.join(UPLOAD_DIR, filename)
  await writeFile(filePath, buffer)
  return filePath
}

export async function readFileFromDisk(filename: string): Promise<Buffer> {
  const filePath = path.join(UPLOAD_DIR, filename)
  return await readFile(filePath)
}

export function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniqueId = uuidv4();
  return `${sanitizedName}_${uniqueId}${ext}`;
}

export function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/')) return 'text';
  return 'other';
}
