"use client"

import { DailyActivityTracking } from "@/components/daily-activity-tracking"

export default function DailyActivityPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Daily Activity Tracking</h1>
      <DailyActivityTracking />
    </div>
  )
}
