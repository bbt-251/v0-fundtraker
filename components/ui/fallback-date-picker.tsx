"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface FallbackDatePickerProps {
  date?: Date | null
  onDateChange: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function FallbackDatePicker({
  date,
  onDateChange,
  className,
  placeholder = "Select date",
  disabled = false,
}: FallbackDatePickerProps) {
  const [dateString, setDateString] = useState<string>("")

  // Initialize the date string when the component mounts or date prop changes
  useEffect(() => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      setDateString(`${year}-${month}-${day}`)
    } else {
      setDateString("")
    }
  }, [date])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateString = e.target.value
    setDateString(newDateString)

    if (newDateString) {
      const newDate = new Date(newDateString)
      if (!isNaN(newDate.getTime())) {
        onDateChange(newDate)
      }
    } else {
      onDateChange(undefined)
    }
  }

  return (
    <input
      type="date"
      value={dateString}
      onChange={handleChange}
      className={cn(
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}

interface FallbackDateRangePickerProps {
  dateRange?: { from?: Date | null; to?: Date | null } | null
  setDateRange: (range: { from?: Date; to?: Date } | undefined) => void
  className?: string
  placeholder?: [string, string]
  disabled?: boolean | [boolean, boolean]
}

export function FallbackDateRangePicker({
  dateRange,
  setDateRange,
  className,
  placeholder = ["Start date", "End date"],
  disabled = false,
}: FallbackDateRangePickerProps) {
  const [fromDateString, setFromDateString] = useState<string>("")
  const [toDateString, setToDateString] = useState<string>("")

  // Initialize the date strings when the component mounts or dateRange prop changes
  useEffect(() => {
    if (dateRange?.from) {
      const year = dateRange.from.getFullYear()
      const month = String(dateRange.from.getMonth() + 1).padStart(2, "0")
      const day = String(dateRange.from.getDate()).padStart(2, "0")
      setFromDateString(`${year}-${month}-${day}`)
    } else {
      setFromDateString("")
    }

    if (dateRange?.to) {
      const year = dateRange.to.getFullYear()
      const month = String(dateRange.to.getMonth() + 1).padStart(2, "0")
      const day = String(dateRange.to.getDate()).padStart(2, "0")
      setToDateString(`${year}-${month}-${day}`)
    } else {
      setToDateString("")
    }
  }, [dateRange])

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateString = e.target.value
    setFromDateString(newDateString)

    if (newDateString) {
      const newDate = new Date(newDateString)
      if (!isNaN(newDate.getTime())) {
        setDateRange({
          from: newDate,
          to: dateRange?.to,
        })
      }
    } else {
      setDateRange({
        from: undefined,
        to: dateRange?.to,
      })
    }
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateString = e.target.value
    setToDateString(newDateString)

    if (newDateString) {
      const newDate = new Date(newDateString)
      if (!isNaN(newDate.getTime())) {
        setDateRange({
          from: dateRange?.from,
          to: newDate,
        })
      }
    } else {
      setDateRange({
        from: dateRange?.from,
        to: undefined,
      })
    }
  }

  const isDisabled = typeof disabled === "boolean" ? disabled : false
  const isFromDisabled = Array.isArray(disabled) ? disabled[0] : isDisabled
  const isToDisabled = Array.isArray(disabled) ? disabled[1] : isDisabled

  return (
    <div className={cn("flex w-full gap-2", className)}>
      <input
        type="date"
        value={fromDateString}
        onChange={handleFromChange}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={placeholder[0]}
        disabled={isFromDisabled}
      />
      <input
        type="date"
        value={toDateString}
        onChange={handleToChange}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={placeholder[1]}
        disabled={isToDisabled}
      />
    </div>
  )
}
