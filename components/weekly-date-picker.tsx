"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"

interface WeeklyDatePickerProps {
  initialDate?: Date
  onWeekChange?: (startDate: Date, endDate: Date) => void
}

export function WeeklyDatePicker({ initialDate, onWeekChange }: WeeklyDatePickerProps) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date())
  const [startDate, setStartDate] = useState<Date>(startOfWeek(currentDate, { weekStartsOn: 1 }))
  const [endDate, setEndDate] = useState<Date>(endOfWeek(currentDate, { weekStartsOn: 1 }))

  // Update week range when current date changes
  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })

    setStartDate(start)
    setEndDate(end)

    // Only call onWeekChange if it exists and if the dates have actually changed
    if (onWeekChange && (start.getTime() !== startDate.getTime() || end.getTime() !== endDate.getTime())) {
      onWeekChange(start, end)
    }
  }, [currentDate, onWeekChange, startDate, endDate])

  // Go to previous week - use useCallback to memoize
  const previousWeek = useCallback(() => {
    setCurrentDate((prevDate) => subWeeks(prevDate, 1))
  }, [])

  // Go to next week - use useCallback to memoize
  const nextWeek = useCallback(() => {
    setCurrentDate((prevDate) => addWeeks(prevDate, 1))
  }, [])

  // Go to current week - use useCallback to memoize
  const currentWeek = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="icon" onClick={previousWeek} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center bg-muted rounded-md px-3 py-1.5">
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-sm font-medium">
          {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
        </span>
      </div>

      <Button variant="outline" size="icon" onClick={nextWeek} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="sm" onClick={currentWeek}>
        Current Week
      </Button>
    </div>
  )
}
