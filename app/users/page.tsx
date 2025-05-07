"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { AlertCircle, Eye, Loader2 } from "lucide-react"
import { getPendingVerifications, verifyUser } from "@/services/user-service"
import { useToast } from "@/components/ui/toast"
import type { UserProfile } from "@/types/user"

export default function UsersPage() {
  const { user, userProfile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const { success: showSuccess, error: showError } = useToast()

  useEffect(() => {
    async function fetchUsers() {
      if (!userProfile || userProfile.role !== "Platform Governor") return

      try {
        const pendingUsers = await getPendingVerifications()
        setUsers(pendingUsers)
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
      setUsers(users.filter((user) => user.uid !== uid))
      setSelectedUser(null)
    } catch (error) {
      console.error("Error verifying user:", error)
      showError(`Failed to ${verified ? "verify" : "reject"} user`)
    } finally {
      setIsVerifying(false)
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pending Verifications</h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No pending verifications</div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                {/* Users list */}
                <div className="w-full md:w-1/3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                      {users.map((user) => (
                        <li key={user.uid}>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left px-4 py-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 ${
                              selectedUser?.uid === user.uid ? "bg-blue-50 dark:bg-blue-900/30" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email?.split("@")[0]}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                              <div className="mt-1 flex items-center">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Pending
                                </span>
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{user.role}</span>
                              </div>
                            </div>
                            <Eye className="h-5 w-5 text-gray-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* User details */}
                <div className="w-full md:w-2/3">
                  {selectedUser ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-6">
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
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {selectedUser.email || "Not provided"}
                              </p>
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
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              Verification Documents
                            </h3>
                            <div className="mt-4 space-y-4">
                              {selectedUser.verificationDocuments.map((doc, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-md p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.type}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Uploaded: {doc.uploadedAt}
                                      </p>
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

                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => handleVerify(selectedUser.uid, false)}
                            disabled={isVerifying}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {isVerifying ? "Rejecting..." : "Reject"}
                          </button>
                          <button
                            onClick={() => handleVerify(selectedUser.uid, true)}
                            disabled={isVerifying}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {isVerifying ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-6 flex items-center justify-center h-64">
                      <p className="text-gray-500 dark:text-gray-400">Select a user to view details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
