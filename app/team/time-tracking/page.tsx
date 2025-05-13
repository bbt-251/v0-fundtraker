"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, PlusCircle } from "lucide-react"

export default function TimeTrackingPage() {
  return (
    <div className="flex flex-col">
      <header className="flex h-[5rem] items-center gap-4 border-b bg-background px-6 pt-10 pb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Time Tracking & Leave</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage team time tracking and leave requests</p>
        </div>
      </header>

      <div className="flex-1 p-6">
        <Tabs defaultValue="time-tracking" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="time-tracking">
              <Clock className="mr-2 h-4 w-4" />
              Time Tracking
            </TabsTrigger>
            <TabsTrigger value="leave-management">
              <Calendar className="mr-2 h-4 w-4" />
              Leave Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time-tracking" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Time Tracking</CardTitle>
                  <CardDescription>Track time spent on projects and tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track time for your team members across different projects and tasks.
                  </p>
                  <Button className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Time Entry
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Time Reports</CardTitle>
                  <CardDescription>View and export time reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate reports on time spent by team members on projects and tasks.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Reports
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Time Approvals</CardTitle>
                  <CardDescription>Approve time entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review and approve time entries submitted by team members.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Pending Approvals
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leave-management" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>Manage leave requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage leave requests from team members.
                  </p>
                  <Button className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Leave Request
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Leave Calendar</CardTitle>
                  <CardDescription>View team leave calendar</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View a calendar of all approved leave for your team.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Calendar
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Leave Policies</CardTitle>
                  <CardDescription>Manage leave policies</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Set up and manage leave policies for your team.</p>
                  <Button variant="outline" className="w-full">
                    Manage Policies
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
