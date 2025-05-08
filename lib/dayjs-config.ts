import dayjs from "dayjs"

// Import plugins conditionally to avoid issues
try {
  // Only import and extend with plugins if dayjs is available
  const weekday = require("dayjs/plugin/weekday")
  const localeData = require("dayjs/plugin/localeData")
  const weekOfYear = require("dayjs/plugin/weekOfYear")
  const customParseFormat = require("dayjs/plugin/customParseFormat")
  const isBetween = require("dayjs/plugin/isBetween")
  const utc = require("dayjs/plugin/utc")
  const timezone = require("dayjs/plugin/timezone")

  // Extend dayjs with plugins
  dayjs.extend(weekday)
  dayjs.extend(localeData)
  dayjs.extend(weekOfYear)
  dayjs.extend(customParseFormat)
  dayjs.extend(isBetween)
  dayjs.extend(utc)
  dayjs.extend(timezone)
} catch (error) {
  console.warn("Failed to load dayjs plugins:", error)
}

export default dayjs
