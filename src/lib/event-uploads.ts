import fs from 'fs'
import path from 'path'

export class UploadValidationError extends Error {}

interface SaveEventUploadOptions {
  eventId: string
  file: File
  allowedExtensions: string[]
  maxSizeBytes: number
  /** Appended to the event id before the extension, e.g. "-logo", to avoid colliding with other uploads for the same event. */
  suffix?: string
  /** Existing relative path (under /public) to delete before writing the new file, if any. */
  previousPath?: string | null
}

/**
 * Validates and persists an admin-uploaded event asset (certificate background or
 * logo) under public/uploads/events/, returning the path to store on the Event
 * record (relative to /public, as consumed by certificate-pdf.ts).
 */
export async function saveEventUpload({
  eventId,
  file,
  allowedExtensions,
  maxSizeBytes,
  suffix = '',
  previousPath,
}: SaveEventUploadOptions): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (!allowedExtensions.includes(extension)) {
    throw new UploadValidationError(`Format file harus ${allowedExtensions.join('/').toUpperCase()}`)
  }
  if (file.size > maxSizeBytes) {
    throw new UploadValidationError(`Ukuran file maksimal ${Math.round(maxSizeBytes / (1024 * 1024))}MB`)
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'events')
  fs.mkdirSync(uploadsDir, { recursive: true })

  if (previousPath) {
    try {
      fs.unlinkSync(path.join(process.cwd(), 'public', previousPath))
    } catch {
      // ignore if it doesn't exist
    }
  }

  const relativePath = `uploads/events/${eventId}${suffix}.${extension}`
  const bytes = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(process.cwd(), 'public', relativePath), bytes)
  return relativePath
}
