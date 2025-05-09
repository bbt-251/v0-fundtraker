"use client"

import { useState, useEffect } from "react"
import { DatePicker, DateRangePicker } from "./ant-date-picker"
import { FallbackDatePicker, FallbackDateRangePicker } from "./fallback-date-picker"

interface DatePickerWrapperProps {
  date?: Date | null
  onDateChange: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  format?: string
  showTime?: boolean
  disabled?: boolean
}

export function DatePickerWrapper(props: DatePickerWrapperProps) {
  const [useAntd, setUseAntd] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Check if we can use dayjs
    try {
      // Try to use a dayjs function that requires plugins
      const dayjs = require("dayjs")
      dayjs().weekday
      setUseAntd(true)
    } catch (err) {
      console.warn("Falling back to native date picker:", err)
      setError(err as Error)
      setUseAntd(false)
    }
  }, [])

  if (!useAntd || error) {
    return <FallbackDatePicker {...props} />
  }

  return <DatePicker {...props} />
}

interface DateRangePickerWrapperProps {
  dateRange?: { from?: Date | null; to?: Date | null } | null
  setDateRange: (range: { from?: Date; to?: Date } | undefined) => void
  className?: string
  placeholder?: [string, string]
  format?: string
  showTime?: boolean
  disabled?: boolean | [boolean, boolean]
}

export function DateRangePickerWrapper(props: DateRangePickerWrapperProps) {
  const [useAntd, setUseAntd] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Check if we can use dayjs
    try {
      // Try to use a dayjs function that requires plugins
      const dayjs = require("dayjs")
      dayjs().weekday
      setUseAntd(true)
    } catch (err) {
      console.warn("Falling back to native date range picker:", err)
      setError(err as Error)
      setUseAntd(false)
    }
  }, [])

  if (!useAntd || error) {
    return <FallbackDateRangePicker {...props} />
  }

  return <DateRangePicker {...props} />
}
