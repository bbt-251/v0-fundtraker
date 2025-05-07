"use client"

import { useState, useEffect } from "react"
import { getProjectDonations } from "@/services/donation-service"
import type { Donation } from "@/types/donation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingAnimation } from "@/components/loading-animation"

interface ProjectDonationsProps {
  projectId: string
}

export function ProjectDonations({ projectId }: ProjectDonationsProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDonations() {
      try {
        setLoading(true)
        const donationsData = await getProjectDonations(projectId)
        setDonations(donationsData)
      } catch (err: any) {
        setError(err.message || "Failed to fetch donations")
      } finally {
        setLoading(false)
      }
    }

    fetchDonations()
  }, [projectId])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString()
    } catch (error) {
      console.error("Error formatting date:", error)
      return "N/A"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingAnimation />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md text-red-800 dark:text-red-200">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Donations</CardTitle>
        <CardDescription>
          {donations.length} donation{donations.length !== 1 ? "s" : ""} received
        </CardDescription>
      </CardHeader>
      <CardContent>
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {donation.isAnonymous ? "Anonymous" : donation.donorName || "Unnamed Donor"}
                    </p>
                    {donation.isAnonymous && (
                      <Badge variant="outline" className="text-xs">
                        Anonymous
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(donation.timestamp)}</p>
                  {donation.message && (
                    <p className="mt-1 text-sm italic text-gray-600 dark:text-gray-300">"{donation.message}"</p>
                  )}
                </div>
                <p className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(donation.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No donations yet. Be the first to donate!</p>
        )}
      </CardContent>
    </Card>
  )
}
