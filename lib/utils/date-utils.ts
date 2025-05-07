/**
 * Format a date to a readable string
 * @param date The date to format (can be Date object, timestamp, or string)
 * @returns A formatted date string
 */
export function formatDate(date: Date | number | string): string {
  if (!date) return "N/A"

  let dateObj: Date

  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === "number") {
    dateObj = new Date(date)
  } else if (typeof date === "string") {
    // Try to parse the string as a date
    dateObj = new Date(date)
  } else {
    return "Invalid Date"
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date"
  }

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format a timestamp to a readable string
 * @param timestamp The timestamp to format
 * @returns A formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return formatDate(timestamp)
}

/**
 * Get the current date as a string
 * @returns The current date as a string
 */
export function getCurrentDate(): string {
  return formatDate(new Date())
}

/**
 * Get a relative time string (e.g. "2 hours ago")
 * @param date The date to get the relative time for (can be Date object, timestamp, or string)
 * @returns A relative time string
 */
export function getRelativeTime(date: Date | number | string): string {
  if (!date) return "N/A"

  let dateObj: Date

  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === "number") {
    dateObj = new Date(date)
  } else if (typeof date === "string") {
    dateObj = new Date(date)
  } else {
    return "Invalid Date"
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date"
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now"
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${days === 1 ? "day" : "days"} ago`
  }

  // Less than a month
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
  }

  // Less than a year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months} ${months === 1 ? "month" : "months"} ago`
  }

  // More than a year
  const years = Math.floor(diffInSeconds / 31536000)
  return `${years} ${years === 1 ? "year" : "years"} ago`
}

/**
 * Format a date to a time string
 * @param date The date to format (can be Date object, timestamp, or string)
 * @returns A formatted time string
 */
export function formatTime(date: Date | number | string): string {
  if (!date) return "N/A"

  let dateObj: Date

  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === "number") {
    dateObj = new Date(date)
  } else if (typeof date === "string") {
    dateObj = new Date(date)
  } else {
    return "Invalid Time"
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid Time"
  }

  return dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format a date to a datetime string
 * @param date The date to format (can be Date object, timestamp, or string)
 * @returns A formatted datetime string
 */
export function formatDateTime(date: Date | number | string): string {
  if (!date) return "N/A"
  return `${formatDate(date)} at ${formatTime(date)}`
}

/**
 * Get the current timestamp as a string
 * @returns The current timestamp as a string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}
