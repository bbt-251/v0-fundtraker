"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRisks } from "@/services/risk-service"
import { message } from "antd"
import { LoadingAnimation } from "@/components/loading-animation"
import { format } from "date-fns"

interface Risk {
  id: string
  title: string
  description: string
  severity: "Critical" | "High" | "Medium" | "Low"
  dateIdentified: Date | string
  mitigation: string
}

export function Risks() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRisks() {
      try {
        setLoading(true)
        const fetchedRisks = await getRisks()
        setRisks(fetchedRisks)
      } catch (error) {
        console.error("Error fetching risks:", error)
        message.error("Failed to load risks")
      } finally {
        setLoading(false)
      }
    }

    fetchRisks()
  }, [])

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-100"
      case "High":
        return "text-red-600 bg-red-100"
      case "Medium":
        return "text-orange-600 bg-orange-100"
      case "Low":
        return "text-green-600 bg-green-100"
      default:
        return "text-blue-600 bg-blue-100"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risks</CardTitle>
          <CardDescription>Identify and monitor potential risks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <LoadingAnimation />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Risks</CardTitle>
            <CardDescription>Identify and monitor potential risks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {risks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No risks identified for this project yet.</div>
          ) : (
            risks.map((risk) => (
              <div key={risk.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{risk.title}</h3>
                      <p className="text-sm text-muted-foreground">{risk.id}</p>
                    </div>
                    <span className={`text-sm font-medium ${getSeverityClass(risk.severity)} px-2 py-1 rounded-full`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm mt-2">{risk.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Identified: {format(new Date(risk.dateIdentified), "MMMM d, yyyy")}</span>
                    <span>Mitigation: {risk.mitigation}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
