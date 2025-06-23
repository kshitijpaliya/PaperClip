import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

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
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const extension = path.extname(originalName)
  const nameWithoutExt = path.basename(originalName, extension)
  return `${nameWithoutExt}-${timestamp}-${random}${extension}`
}
