"use client"
import { DatePicker as AntDatePicker, ConfigProvider } from "antd"
import { useTheme } from "next-themes"
import type { DatePickerProps, RangePickerProps } from "antd/es/date-picker"
import dayjs from "dayjs"
import type { Dayjs } from "dayjs"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

// Import antd styles
import "antd/dist/reset.css"

// Import our dayjs configuration
import "@/lib/dayjs-config"

interface CustomDatePickerProps {
  date?: Date | null
  onDateChange: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  format?: string
  showTime?: boolean
  disabled?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder = "Select date",
  format = "YYYY-MM-DD",
  showTime = false,
  disabled = false,
}: CustomDatePickerProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [isClient, setIsClient] = useState(false)

  // Only render the DatePicker on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleChange: DatePickerProps["onChange"] = (date: Dayjs | null) => {
    onDateChange(date ? date.toDate() : undefined)
  }

  // Ensure we're passing a valid dayjs object or null to the DatePicker
  const dayjsValue = date ? dayjs(date) : null

  // Don't render the DatePicker on the server
  if (!isClient) {
    return <div className={cn("h-10 w-full rounded-md border", className)}></div>
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: isDark ? "#1e293b" : "#ffffff",
          colorBorder: isDark ? "#334155" : "#e2e8f0",
          colorText: isDark ? "#e2e8f0" : "#1e293b",
          colorTextPlaceholder: isDark ? "#64748b" : "#94a3b8",
          borderRadius: 6,
          controlHeight: 42,
          fontSize: 14,
        },
        components: {
          DatePicker: {
            activeBorderColor: "#3b82f6",
            activeShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
            colorPrimary: "#3b82f6",
            colorPrimaryHover: "#60a5fa",
            colorBgElevated: isDark ? "#1e293b" : "#cbd5e1",
            colorTextQuaternary: isDark ? "#64748b" : "#94a3b8",
            colorSplit: isDark ? "#334155" : "#e2e8f0",
            colorIcon: isDark ? "#64748b" : "#94a3b8",
            colorIconHover: isDark ? "#e2e8f0" : "#1e293b",
            colorTextDisabled: isDark ? "#475569" : "#cbd5e1",
            colorBgContainerDisabled: isDark ? "#0f172a" : "#f1f5f9",
          },
        },
      }}
    >
      <AntDatePicker
        value={dayjsValue}
        onChange={handleChange}
        className={cn(
          "w-full border-0 bg-transparent focus:ring-0 focus:ring-offset-0",
          isDark ? "text-slate-200" : "text-slate-900",
          className,
        )}
        placeholder={placeholder}
        format={format}
        showTime={showTime}
        disabled={disabled}
        popupClassName={isDark ? "ant-picker-dropdown-dark" : ""}
        style={{
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          borderColor: isDark ? "#334155" : "#e2e8f0",
          color: isDark ? "#e2e8f0" : "#1e293b",
        }}
      />
    </ConfigProvider>
  )
}

interface CustomRangePickerProps {
  dateRange?: { from?: Date | null; to?: Date | null } | null
  setDateRange: (range: { from?: Date; to?: Date } | undefined) => void
  className?: string
  placeholder?: [string, string]
  format?: string
  showTime?: boolean
  disabled?: boolean | [boolean, boolean]
}

export function DateRangePicker({
  dateRange,
  setDateRange,
  className,
  placeholder = ["Start date", "End date"],
  format = "YYYY-MM-DD",
  showTime = false,
  disabled = false,
}: CustomRangePickerProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [isClient, setIsClient] = useState(false)

  // Only render the RangePicker on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleChange: RangePickerProps["onChange"] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange({
        from: dates[0].toDate(),
        to: dates[1].toDate(),
      })
    } else {
      setDateRange(undefined)
    }
  }

  // Ensure we're passing valid dayjs objects or null to the RangePicker
  const dayjsValues = dateRange
    ? [dateRange.from ? dayjs(dateRange.from) : null, dateRange.to ? dayjs(dateRange.to) : null]
    : null

  // Don't render the RangePicker on the server
  if (!isClient) {
    return <div className={cn("h-10 w-full rounded-md border", className)}></div>
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: isDark ? "#1e293b" : "#ffffff",
          colorBorder: isDark ? "#334155" : "#e2e8f0",
          colorText: isDark ? "#e2e8f0" : "#1e293b",
          colorTextPlaceholder: isDark ? "#64748b" : "#94a3b8",
          borderRadius: 6,
          controlHeight: 42,
          fontSize: 14,
        },
        components: {
          DatePicker: {
            activeBorderColor: "#3b82f6",
            activeShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
            colorPrimary: "#3b82f6",
            colorPrimaryHover: "#60a5fa",
            colorBgElevated: isDark ? "#374151" : "#ffffff",
            colorTextQuaternary: isDark ? "#64748b" : "#94a3b8",
            colorSplit: isDark ? "#334155" : "#e2e8f0",
            colorIcon: isDark ? "#64748b" : "#94a3b8",
            colorIconHover: isDark ? "#e2e8f0" : "#374151",
            colorTextDisabled: isDark ? "#475569" : "#cbd5e1",
            colorBgContainerDisabled: isDark ? "#0f172a" : "#f1f5f9",
            cellRangeBorderColor: "#3b82f6",
            cellActiveWithRangeBg: isDark ? "#1e40af" : "#dbeafe",
            cellHoverWithRangeBg: isDark ? "#1e40af" : "#dbeafe",
            cellRangeHoverBg: isDark ? "#1e40af" : "#dbeafe",
            cellRangeBg: isDark ? "#1e3a8a" : "#bfdbfe",
          },
        },
      }}
    >
      <AntDatePicker.RangePicker
        value={dayjsValues as [Dayjs | null, Dayjs | null] | null}
        onChange={handleChange}
        className={cn(
          "w-full border-0 bg-transparent focus:ring-0 focus:ring-offset-0",
          isDark ? "text-slate-200" : "text-slate-900",
          className,
        )}
        placeholder={placeholder}
        format={format}
        showTime={showTime}
        disabled={disabled}
        popupClassName={isDark ? "ant-picker-dropdown-dark" : ""}
        style={{
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          borderColor: isDark ? "#334155" : "#e2e8f0",
          color: isDark ? "#e2e8f0" : "#1e293b",
        }}
      />
    </ConfigProvider>
  )
}
