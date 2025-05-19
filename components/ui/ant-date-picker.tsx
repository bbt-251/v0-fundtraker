"use client"
import { DatePicker as AntDatePicker } from "antd"
import type { DatePickerProps } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/en"
import { cn } from "@/lib/utils"

interface CustomDatePickerProps extends Omit<DatePickerProps, "onChange"> {
  value?: Date | null
  onChange?: (date: Date | null) => void
  className?: string
}

export function DatePicker({ value, onChange, format = "YYYY-MM-DD", className, ...props }: CustomDatePickerProps) {
  const handleChange: DatePickerProps["onChange"] = (date, dateString) => {
    if (onChange) {
      // Pass the selected date string to the parent component
      onChange(date ? date.toDate() : null)
    }
  }

  return (
    <AntDatePicker
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      format={format}
      className={cn("w-full", className)}
      {...props}
    />
  )
}

import { ConfigProvider } from "antd"
import { useTheme } from "next-themes"
import type { RangePickerProps } from "antd/es/date-picker"
import type { Dayjs } from "dayjs"

// Import antd styles
import "antd/dist/reset.css"

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
            // Add these new properties for better range visibility
            cellRangeBorderColor: "#3b82f6",
            cellActiveWithRangeBg: isDark ? "#1e40af" : "#dbeafe", // Darker blue in dark mode, light blue in light mode
            cellHoverWithRangeBg: isDark ? "#1e40af" : "#dbeafe",
            cellRangeHoverBg: isDark ? "#1e40af" : "#dbeafe",
            cellRangeBg: isDark ? "#1e3a8a" : "#bfdbfe", // Even darker blue in dark mode, medium blue in light mode
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
