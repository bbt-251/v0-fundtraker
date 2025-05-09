// Import dayjs core
import dayjs from "dayjs"

// We'll use a simpler approach that works in the v0 preview environment
// Instead of importing plugins directly, we'll check if they're available first

// Define a function to safely extend dayjs with a plugin
const safeExtend = (plugin: any) => {
  if (plugin) {
    try {
      dayjs.extend(plugin)
    } catch (error) {
      console.warn(`Failed to extend dayjs with plugin:`, error)
    }
  }
}

// Only try to load plugins if we're in a browser environment
if (typeof window !== "undefined") {
  // Import plugins using dynamic imports to avoid MIME type issues
  import("dayjs/plugin/weekday").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/localeData").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/weekOfYear").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/customParseFormat").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/isBetween").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/utc").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/timezone").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/advancedFormat").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/quarterOfYear").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/weekYear").then((module) => safeExtend(module.default)).catch(() => {})
  import("dayjs/plugin/updateLocale")
    .then((module) => {
      safeExtend(module.default)
      // Set the first day of the week to Monday (1) after the plugin is loaded
      dayjs.updateLocale("en", { weekStart: 1 })
    })
    .catch(() => {})
}

export default dayjs
