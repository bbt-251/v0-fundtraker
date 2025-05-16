/**
 * Format file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Get a friendly file type name from a MIME type
 */
export function getFileTypeName(mimeType: string): string {
  if (!mimeType) return "Unknown"

  if (mimeType.startsWith("image/")) {
    return mimeType.replace("image/", "").toUpperCase() + " Image"
  }

  if (mimeType.startsWith("video/")) {
    return mimeType.replace("video/", "").toUpperCase() + " Video"
  }

  if (mimeType.startsWith("audio/")) {
    return mimeType.replace("audio/", "").toUpperCase() + " Audio"
  }

  if (mimeType === "application/pdf") {
    return "PDF Document"
  }

  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "Spreadsheet"
  }

  if (mimeType.includes("word") || mimeType.includes("document")) {
    return "Document"
  }

  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return "Presentation"
  }

  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return "Archive"
  }

  if (mimeType.includes("text/")) {
    return "Text File"
  }

  return mimeType.split("/").pop()?.toUpperCase() || "File"
}

/**
 * Check if a file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/")
}

/**
 * Check if a file is a document (PDF, Word, etc.)
 */
export function isDocumentFile(mimeType: string): boolean {
  return (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text/")
  )
}
