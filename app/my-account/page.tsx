"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { Shield, AlertCircle, Upload, Check, X, Loader2, Calendar, Phone, UserIcon, MapPin } from "lucide-react"
import { updatePersonalInfo, updateAddressInfo, uploadVerificationDocument } from "@/services/user-service"
import { useToast } from "@/hooks/use-toast"
import type { VerificationDocument } from "@/types/user"
import dayjs from "dayjs"

export default function MyAccountPage() {
    // This is the same as the current Account page, just renamed
    const { user, userProfile } = useAuth()
    const [activeTab, setActiveTab] = useState("profile")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { success: showSuccess, error: showError } = useToast()

    // Personal information form
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [dateOfBirth, setDateOfBirth] = useState("")

    // Address information form
    const [street, setStreet] = useState("")
    const [city, setCity] = useState("")
    const [state, setState] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [country, setCountry] = useState("")

    // Verification document
    const [idDocument, setIdDocument] = useState<File | null>(null)
    const [addressDocument, setAddressDocument] = useState<File | null>(null)

    // Load user data
    useEffect(() => {
        if (userProfile) {
            // Load personal info
            if (userProfile.firstName) setFirstName(userProfile.firstName)
            if (userProfile.lastName) setLastName(userProfile.lastName)
            if (userProfile.phoneNumber) setPhoneNumber(userProfile.phoneNumber)
            if (userProfile.dateOfBirth) setDateOfBirth(userProfile.dateOfBirth)

            // Load address info
            if (userProfile.address) {
                setStreet(userProfile.address.street)
                setCity(userProfile.address.city)
                setState(userProfile.address.state)
                setPostalCode(userProfile.address.postalCode)
                setCountry(userProfile.address.country)
            }
        }
    }, [userProfile])

    const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsSubmitting(true)
        try {
            await updatePersonalInfo(user.uid, firstName, lastName, phoneNumber, dateOfBirth)
            showSuccess("Personal information updated successfully")
        } catch (error) {
            console.error("Error updating personal info:", error)
            showError("Failed to update personal information")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsSubmitting(true)
        try {
            await updateAddressInfo(user.uid, {
                street,
                city,
                state,
                postalCode,
                country,
            })
            showSuccess("Address information updated successfully")
        } catch (error) {
            console.error("Error updating address info:", error)
            showError("Failed to update address information")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDocumentUpload = async (documentType: string, file: File | null) => {
        if (!user || !file) return

        setIsSubmitting(true)
        try {
            await uploadVerificationDocument(user.uid, file, documentType)
            showSuccess(`${documentType} document uploaded successfully`)

            // Reset the file input
            if (documentType === "id") {
                setIdDocument(null)
            } else {
                setAddressDocument(null)
            }
        } catch (error) {
            console.error(`Error uploading ${documentType} document:`, error)
            showError(`Failed to upload ${documentType} document`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getVerificationDocumentStatus = (type: string): VerificationDocument | undefined => {
        if (!userProfile?.verificationDocuments) return undefined
        return userProfile.verificationDocuments.find((doc) => doc.type === type)
    }

    const idDocStatus = getVerificationDocumentStatus("id")
    const addressDocStatus = getVerificationDocumentStatus("address")

    if (!user || !userProfile) {
        return (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">
                You must be logged in to view this page
            </div>
        )
    }

    return (
        <div className="p-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Account</h1>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-6">
                            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                                {user.email?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="ml-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {userProfile.firstName && userProfile.lastName
                                        ? `${userProfile.firstName} ${userProfile.lastName}`
                                        : user.email?.split("@")[0] || "User"}
                                </h2>
                                <div className="flex items-center mt-1">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Status:</span>
                                    {userProfile.verified ? (
                                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center">
                                            <Shield className="mr-1 h-4 w-4" />
                                            Verified
                                        </span>
                                    ) : userProfile.verificationStatus === "pending" ? (
                                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center">
                                            <AlertCircle className="mr-1 h-4 w-4" />
                                            Pending Verification
                                        </span>
                                    ) : userProfile.verificationStatus === "rejected" ? (
                                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center">
                                            <X className="mr-1 h-4 w-4" />
                                            Verification Rejected
                                        </span>
                                    ) : (
                                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center">
                                            <AlertCircle className="mr-1 h-4 w-4" />
                                            Not Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{userProfile.role}</p>
                            </div>
                        </div>

                        {/* Tab navigation */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab("profile")}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === "profile"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Personal Information
                                </button>
                                <button
                                    onClick={() => setActiveTab("address")}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === "address"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Address Information
                                </button>
                                <button
                                    onClick={() => setActiveTab("verification")}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === "verification"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Verification Documents
                                </button>
                            </nav>
                        </div>

                        {/* Personal Information Tab */}
                        {activeTab === "profile" && (
                            <div className="mt-6">
                                <form onSubmit={handlePersonalInfoSubmit}>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div className="relative">
                                            <label
                                                htmlFor="firstName"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                First Name
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="firstName"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label
                                                htmlFor="lastName"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Last Name
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="lastName"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label
                                                htmlFor="phoneNumber"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Phone Number
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    id="phoneNumber"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label
                                                htmlFor="dateOfBirth"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Date of Birth
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Calendar className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="date"
                                                    id="dateOfBirth"
                                                    value={dateOfBirth}
                                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save Personal Information"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Address Information Tab */}
                        {activeTab === "address" && (
                            <div className="mt-6">
                                <form onSubmit={handleAddressSubmit}>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div className="sm:col-span-2 relative">
                                            <label
                                                htmlFor="street"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Street Address
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="street"
                                                    value={street}
                                                    onChange={(e) => setStreet(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                City
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="city"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label
                                                htmlFor="state"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                State / Province
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="state"
                                                    value={state}
                                                    onChange={(e) => setState(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label
                                                htmlFor="postalCode"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Postal Code
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="postalCode"
                                                    value={postalCode}
                                                    onChange={(e) => setPostalCode(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <label
                                                htmlFor="country"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                            >
                                                Country
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="country"
                                                    value={country}
                                                    onChange={(e) => setCountry(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save Address Information"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Verification Documents Tab */}
                        {activeTab === "verification" && (
                            <div className="mt-6">
                                <div className="space-y-6">
                                    {/* ID Document */}
                                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Shield className="mr-2 h-5 w-5 text-blue-500" />
                                            Identity Document
                                        </h3>

                                        {idDocStatus ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="ml-3">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Uploaded on {dayjs(idDocStatus.uploadedAt).format("MMMM DD, YYYY hh:mm A")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={idDocStatus.fileURL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center"
                                                >
                                                    View Document
                                                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                        />
                                                    </svg>
                                                </a>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                    Please upload a government-issued ID (passport, driver's license, or national ID card)
                                                </p>
                                                <div className="flex items-center">
                                                    <label className="block">
                                                        <span className="sr-only">Choose ID document</span>
                                                        <input
                                                            type="file"
                                                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-medium
                              file:bg-blue-50 file:text-blue-700
                              dark:file:bg-blue-900 dark:file:text-blue-200
                              hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                              transition-colors"
                                                            onChange={(e) => setIdDocument(e.target.files ? e.target.files[0] : null)}
                                                            accept="image/*, application/pdf"
                                                        />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => idDocument && handleDocumentUpload("id", idDocument)}
                                                        disabled={!idDocument || isSubmitting}
                                                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                                    >
                                                        {isSubmitting ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Upload className="h-4 w-4 mr-1" />
                                                        )}
                                                        Upload
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Address Document */}
                                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                            <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                                            Proof of Address
                                        </h3>

                                        {addressDocStatus ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="ml-3">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Uploaded on {dayjs(addressDocStatus.uploadedAt).format("MMMM DD, YYYY hh:mm A")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={addressDocStatus.fileURL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center"
                                                >
                                                    View Document
                                                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                        />
                                                    </svg>
                                                </a>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                    Please upload a proof of address (utility bill, bank statement, or official letter)
                                                </p>
                                                <div className="flex items-center">
                                                    <label className="block">
                                                        <span className="sr-only">Choose address document</span>
                                                        <input
                                                            type="file"
                                                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-medium
                              file:bg-blue-50 file:text-blue-700
                              dark:file:bg-blue-900 dark:file:text-blue-200
                              hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                              transition-colors"
                                                            onChange={(e) => setAddressDocument(e.target.files ? e.target.files[0] : null)}
                                                            accept="image/*, application/pdf"
                                                        />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => addressDocument && handleDocumentUpload("address", addressDocument)}
                                                        disabled={!addressDocument || isSubmitting}
                                                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                                    >
                                                        {isSubmitting ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Upload className="h-4 w-4 mr-1" />
                                                        )}
                                                        Upload
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Verification Status */}
                                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Shield className="mr-2 h-5 w-5 text-blue-500" />
                                            Verification Status
                                        </h3>

                                        {userProfile.verified ? (
                                            <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                                                <Shield className="h-5 w-5 mr-2" />
                                                <span>Your account is fully verified</span>
                                            </div>
                                        ) : userProfile.verificationStatus === "pending" ? (
                                            <div className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                <span>Your verification is being reviewed by our team</span>
                                            </div>
                                        ) : userProfile.verificationStatus === "rejected" ? (
                                            <div className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                                                <X className="h-5 w-5 mr-2" />
                                                <span>Your verification was rejected. Please upload new documents.</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600/20 p-4 rounded-md">
                                                <AlertCircle className="h-5 w-5 mr-2" />
                                                <span>Please upload the required documents to verify your account</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!userProfile.verified && userProfile.verificationStatus !== "pending" && (
                            <div className="mt-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Verification Required</h3>
                                        <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                                            <p>
                                                Please complete your profile and upload verification documents to gain full access to the
                                                platform.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
