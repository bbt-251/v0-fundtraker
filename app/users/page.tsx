"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Info, Loader2 } from "lucide-react"
import { getAllUsers, verifyUser } from "@/services/user-service"
import { useToast } from "@/components/ui/toast"
import type { UserProfile } from "@/types/user"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function UsersPage() {
  const { user, userProfile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { success: showSuccess, error: showError } = useToast()

  useEffect(() => {
    async function fetchUsers() {
      if (!userProfile || userProfile.role !== "Platform Governor") return

      try {
        setIsLoading(true)
        const allUsers = await getAllUsers()
        setUsers(allUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
        showError("Failed to load users")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [userProfile, showError])

  const handleVerify = async (uid: string, verified: boolean) => {
    setIsVerifying(true)
    try {
      await verifyUser(uid, verified)
      showSuccess(`User ${verified ? "verified" : "rejected"} successfully`)

      // Update the local state
      setUsers(
        users.map((user) => {
          if (user.uid === uid) {
            return {
              ...user,
              verified,
              verificationStatus: verified ? "verified" : "rejected",
            }
          }
          return user
        }),
      )
    } catch (error) {
      console.error("Error verifying user:", error)
      showError(`Failed to ${verified ? "verify" : "reject"} user`)
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Verified</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Rejected</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Unverified</Badge>
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">
          You must be logged in to view this page
        </div>
      </div>
    )
  }

  if (userProfile.role !== "Platform Governor") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">
          You do not have permission to view this page
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Management</h1>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Users</h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email?.split("@")[0]}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{getStatusBadge(user.verificationStatus)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowDetails(true)
                              }}
                            >
                              <Info className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                              onClick={() => handleVerify(user.uid, true)}
                              disabled={isVerifying || user.verificationStatus === "verified"}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleVerify(user.uid, false)}
                              disabled={isVerifying || user.verificationStatus === "rejected"}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* User Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the selected user</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Information</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedUser.phoneNumber || "Not provided"}
                    </p>
                  </div>
                  {selectedUser.dateOfBirth && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.dateOfBirth}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedUser.address && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Street</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedUser.address.street || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">City</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedUser.address.city || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">State/Province</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedUser.address.state || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedUser.address.postalCode || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedUser.address.country || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.verificationDocuments && selectedUser.verificationDocuments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Verification Documents</h3>
                  <div className="mt-4 space-y-4">
                    {selectedUser.verificationDocuments.map((doc, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-md p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.type}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded: {doc.uploadedAt}</p>
                          </div>
                          <a
                            href={doc.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
