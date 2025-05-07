// Maximum file size in bytes (10 MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",

  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx

  // Spreadsheets
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx

  // Presentations
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
]

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10 MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    }
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Please upload PDF, PNG, JPG, GIF, or common Office document formats.",
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileTypeIcon(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || ""

  switch (extension) {
    case "pdf":
      return "pdf"
    case "doc":
    case "docx":
      return "word"
    case "xls":
    case "xlsx":
      return "excel"
    case "ppt":
    case "pptx":
      return "powerpoint"
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image"
    default:
      return "generic"
  }
}
