import { writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const TEMP_DIR = '/tmp'

export async function writeTempFile(fileName: string, data: Buffer): Promise<string> {
  const filePath = join(TEMP_DIR, fileName)
  await writeFile(filePath, data)
  return filePath
}

export async function deleteTempFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath)
    }
  } catch (error) {
    console.error(`Failed to delete temp file ${filePath}:`, error)
  }
}

export async function withTempFile<T>(
  fileName: string,
  data: Buffer,
  callback: (filePath: string) => Promise<T>
): Promise<T> {
  const filePath = await writeTempFile(fileName, data)

  try {
    return await callback(filePath)
  } finally {
    await deleteTempFile(filePath)
  }
}

export function generateTempFileName(extension: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
}
