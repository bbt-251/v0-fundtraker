"use client"
import { DatePicker as AntDatePicker, ConfigProvider, Button } from "antd"
import { useTheme } from "next-themes"
import { Plus, X } from "lucide-react"
import type { DatePickerProps, RangePickerProps } from "antd/es/date-picker"
import dayjs from "@/lib/dayjs-config"
import type { Dayjs } from "dayjs"
import { cn } from "@/lib/utils"

// Import antd styles
import "antd/dist/reset.css"

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

  const handleChange: DatePickerProps["onChange"] = (date: Dayjs | null) => {
    onDateChange(date ? date.toDate() : undefined)
  }

  // Ensure we're passing a valid dayjs object or null to the DatePicker
  const dayjsValue = date ? dayjs(date) : null

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

export interface DateRange {
  from?: Date
  to?: Date
}

export interface MultiDateRange {
  ranges: DateRange[]
}

interface DateRangePickerProps {
  dateRange?: DateRange
  setDateRange?: (range: DateRange | undefined) => void
  multiDateRange?: MultiDateRange
  setMultiDateRange?: (ranges: MultiDateRange) => void
  className?: string
  placeholder?: [string, string]
  format?: string
  showTime?: boolean
  disabled?: boolean | [boolean, boolean]
  useMultiple?: boolean
}

export function DateRangePicker({
  dateRange,
  setDateRange,
  multiDateRange,
  setMultiDateRange,
  className,
  placeholder = ["Start date", "End date"],
  format = "YYYY-MM-DD",
  showTime = false,
  disabled = false,
  useMultiple = false,
}: DateRangePickerProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const handleChange: RangePickerProps["onChange"] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      if (setDateRange) {
        setDateRange({
          from: dates[0].toDate(),
          to: dates[1].toDate(),
        })
      }
    } else {
      if (setDateRange) {
        setDateRange(undefined)
      }
    }
  }

  const handleMultiRangeChange = (dates: [Dayjs | null, Dayjs | null] | null, index: number) => {
    if (!multiDateRange || !setMultiDateRange) return

    const newRanges = [...multiDateRange.ranges]

    if (dates && dates[0] && dates[1]) {
      newRanges[index] = {
        from: dates[0].toDate(),
        to: dates[1].toDate(),
      }
    } else {
      newRanges[index] = { from: undefined, to: undefined }
    }

    setMultiDateRange({ ranges: newRanges })
  }

  const addDateRange = () => {
    if (useMultiple && multiDateRange && setMultiDateRange) {
      setMultiDateRange({
        ranges: [...multiDateRange.ranges, { from: undefined, to: undefined }],
      })
    }
  }

  const removeDateRange = (index: number) => {
    if (useMultiple && multiDateRange && setMultiDateRange) {
      const newRanges = [...multiDateRange.ranges]
      newRanges.splice(index, 1)
      setMultiDateRange({ ranges: newRanges })
    }
  }

  // Ensure we're passing valid dayjs objects or null to the RangePicker
  const dayjsValues = dateRange
    ? [dateRange.from ? dayjs(dateRange.from) : null, dateRange.to ? dayjs(dateRange.to) : null]
    : null

  // For the summary button in multiple date range mode
  const formatMultiRangeText = () => {
    if (!multiDateRange || !multiDateRange.ranges.length || !multiDateRange.ranges[0].from) {
      return "Select date ranges"
    }

    const validRanges = multiDateRange.ranges.filter((range) => range.from && range.to)
    return `${validRanges.length} date range${validRanges.length !== 1 ? "s" : ""} selected`
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
      {!useMultiple ? (
        // Single date range picker
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
      ) : (
        // Multiple date range picker
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {formatMultiRangeText()}
            </div>
            <Button
              type="default"
              icon={<Plus className="h-4 w-4" />}
              onClick={addDateRange}
              className="flex items-center justify-center"
            />
          </div>

          {multiDateRange?.ranges.map((range, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-none w-6 text-center text-gray-500">{index + 1}.</div>
              <AntDatePicker.RangePicker
                value={range.from && range.to ? [dayjs(range.from), dayjs(range.to)] : null}
                onChange={(dates) => handleMultiRangeChange(dates as [Dayjs | null, Dayjs | null] | null, index)}
                className="flex-1"
                placeholder={placeholder}
                format={format}
                showTime={showTime}
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  color: isDark ? "#e2e8f0" : "#1e293b",
                }}
              />
              <Button
                type="default"
                danger
                icon={<X className="h-4 w-4" />}
                onClick={() => removeDateRange(index)}
                disabled={multiDateRange.ranges.length <= 1}
                className="flex items-center justify-center"
              />
            </div>
          ))}
        </div>
      )}
    </ConfigProvider>
  )
}
