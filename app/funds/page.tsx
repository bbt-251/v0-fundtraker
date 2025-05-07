"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowUpDown,
  Calendar,
  ChevronUp,
  ClipboardList,
  DollarSign,
  Download,
  FileText,
  Filter,
  LineChart,
  Search,
  Users,
  Wallet,
} from "lucide-react"
import { motion } from "framer-motion"

export default function FundCustodianDashboard() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [mainTab, setMainTab] = useState(tabParam || "collection")
  const [disbursementTab, setDisbursementTab] = useState("active")
  const [withdrawalTab, setWithdrawalTab] = useState("scheduled")

  useEffect(() => {
    if (tabParam) {
      setMainTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Fund Custodian Dashboard</h1>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
            <TabsTrigger
              value="collection"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              onClick={() => setMainTab("collection")}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Fund Collection & Management</span>
              <span className="sm:hidden">Collection</span>
            </TabsTrigger>
            <TabsTrigger
              value="disbursement"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              onClick={() => setMainTab("disbursement")}
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Fund Disbursement Workflow</span>
              <span className="sm:hidden">Disbursement</span>
            </TabsTrigger>
            <TabsTrigger
              value="withdrawal"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              onClick={() => setMainTab("withdrawal")}
            >
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Fund Withdrawal & Reporting</span>
              <span className="sm:hidden">Reporting</span>
            </TabsTrigger>
          </TabsList>

          {/* Fund Collection & Management Content */}
          <TabsContent value="collection" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Funds Managed</p>
                      <h3 className="text-2xl font-bold mt-1">$0</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across 0 active projects</p>
                    </div>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Donors</p>
                      <h3 className="text-2xl font-bold mt-1">0</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supporting our projects</p>
                    </div>
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Receipts</p>
                      <h3 className="text-2xl font-bold mt-1">0</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Waiting to be sent</p>
                    </div>
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Bank Requests</p>
                      <h3 className="text-2xl font-bold mt-1">0</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting approval</p>
                    </div>
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Fund Status */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Fund Status</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                    </Button>
                    <Button variant="outline" size="sm">
                      Reset
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">Progress: 0% - 100%</div>
                    <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search projects..." className="pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-1">
                      <span>Project Name</span>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No projects match your filter criteria</p>
                </div>
              </div>
            </div>

            {/* Recent Donations */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Donations</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                    </Button>
                    <Button variant="outline" size="sm">
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search donors..." className="pl-10" />
                  </div>
                  <div>
                    <select className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option>All Projects</option>
                    </select>
                  </div>
                  <div>
                    <select className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option>All Statuses</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Input type="date" placeholder="From date" />
                  </div>
                  <div>
                    <Input type="date" placeholder="To date" />
                  </div>
                  <div>
                    <select className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option>Date</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <ArrowUpDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No donations match your filter criteria</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fund Disbursement Workflow Content */}
          <TabsContent value="disbursement" className="mt-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Fund Disbursement Overview</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Manage milestone-based disbursements and ensure structured release of funds
              </p>

              {/* Disbursement Sub-tabs */}
              <Tabs value={disbursementTab} onValueChange={setDisbursementTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    onClick={() => setDisbursementTab("active")}
                  >
                    Active Workflows
                  </TabsTrigger>
                  <TabsTrigger
                    value="release"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    onClick={() => setDisbursementTab("release")}
                  >
                    Fund Release Requests
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    onClick={() => setDisbursementTab("pending")}
                  >
                    Pending Workflows
                  </TabsTrigger>
                </TabsList>

                {/* Active Workflows Content */}
                <TabsContent value="active" className="mt-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Active Project Disbursement Workflows
                  </h3>

                  {/* Clean Water Initiative */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                    <div className="p-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">Clean Water Initiative</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Milestone-based fund disbursement workflow
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Milestone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Verified
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                Initial Site Assessment
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Completion of geological surveys and water quality testing
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$30,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jun 15, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                                Completed
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                                Verified
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                Equipment Purchase
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Acquisition of water purification systems and installation tools
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$50,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jul 20, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                                In Progress
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                Installation Phase
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Installation of water systems in target communities
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$40,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Sep 10, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sustainable Energy Project */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="p-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">Sustainable Energy Project</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Milestone-based fund disbursement workflow
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Milestone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Verified
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">Site Selection</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Identification and assessment of optimal locations
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$25,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">May 5, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                                Completed
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                                Verified
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                Equipment Procurement
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Purchase of solar panels and installation materials
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$75,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jun 30, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                                In Progress
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Fund Release Requests Content */}
                <TabsContent value="release" className="mt-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Pending Fund Release Requests
                  </h3>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Milestone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Requested By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Clean Water Initiative
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Equipment Purchase</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$50,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">John Smith</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jul 15, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending Approval
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Sustainable Energy Project
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Equipment Procurement</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$75,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Sarah Johnson</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jun 25, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending Approval
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Pending Workflows Content */}
                <TabsContent value="pending" className="mt-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Pending Disbursement Workflows
                  </h3>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Milestones
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Submitted By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Education Access Initiative
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$120,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">4</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Michael Brown</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jul 10, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending Review
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Review
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Healthcare Outreach Program
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$85,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">3</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Emily Davis</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jul 5, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                                Pending Review
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Review
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Fund Withdrawal & Reporting Content */}
          <TabsContent value="withdrawal" className="mt-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Fund Withdrawal & Reporting</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Track fund withdrawals and generate financial reports
              </p>

              {/* Withdrawal Sub-tabs */}
              <Tabs value={withdrawalTab} onValueChange={setWithdrawalTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
                  <TabsTrigger
                    value="scheduled"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    onClick={() => setWithdrawalTab("scheduled")}
                  >
                    Scheduled Withdrawals
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    onClick={() => setWithdrawalTab("completed")}
                  >
                    Completed Withdrawals
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    onClick={() => setWithdrawalTab("reports")}
                  >
                    Financial Reports
                  </TabsTrigger>
                </TabsList>

                {/* Scheduled Withdrawals Content */}
                <TabsContent value="scheduled" className="mt-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Upcoming Scheduled Withdrawals
                  </h3>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Milestone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Recipient
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Scheduled Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Clean Water Initiative
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Equipment Purchase</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$50,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Water Solutions Inc.</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jul 25, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                                Scheduled
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Sustainable Energy Project
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Equipment Procurement</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$75,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Green Energy Solutions</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Aug 5, 2023</td>
                            <td className="px-6 py-4">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                                Scheduled
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Completed Withdrawals Content */}
                <TabsContent value="completed" className="mt-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Completed Fund Withdrawals</h3>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Milestone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Recipient
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Clean Water Initiative
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Initial Site Assessment</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$30,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Hydro Consultants Ltd.</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jun 20, 2023</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">TRX-2023-06-20-001</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Receipt
                                </Button>
                                <Button variant="outline" size="sm">
                                  Details
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Sustainable Energy Project
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Site Selection</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">$25,000</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">EcoSite Surveyors</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">May 10, 2023</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">TRX-2023-05-10-003</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Receipt
                                </Button>
                                <Button variant="outline" size="sm">
                                  Details
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Financial Reports Content */}
                <TabsContent value="reports" className="mt-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial Reports</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Fund Allocation Summary
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Overview of fund allocation across all active projects
                        </p>
                        <Button className="w-full">Generate Report</Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Disbursement Timeline
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Timeline of all fund disbursements
                        </p>
                        <Button className="w-full">Generate Report</Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Project Financial Health
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Financial health indicators for all projects
                        </p>
                        <Button className="w-full">Generate Report</Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Donor Contribution Analysis
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Analysis of donor contributions and patterns
                        </p>
                        <Button className="w-full">Generate Report</Button>
                      </CardContent>
                    </Card>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Reports</h3>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Report Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Generated By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Format
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Q2 2023 Financial Summary
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Quarterly Report</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Admin User</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jul 1, 2023</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">PDF</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Download
                                </Button>
                                <Button variant="outline" size="sm">
                                  Share
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              Clean Water Initiative - Financial Health
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Project Report</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Admin User</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Jun 15, 2023</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">Excel</td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  Download
                                </Button>
                                <Button variant="outline" size="sm">
                                  Share
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
