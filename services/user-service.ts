"use client"

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { initializeApp, getApps } from "firebase/app"
import { firebaseConfig } from "@/lib/firebase/config"
import type { UserProfile, UserRole, Address, VerificationDocument } from "@/types/user"
import { getCurrentTimestamp } from "@/lib/utils/date-utils"

// Helper function to safely get Firebase services
const getFirebaseServices = () => {
  if (typeof window === "undefined") {
    return { db: null, storage: null }
  }

  try {
    // Check if Firebase is already initialized
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

    // Initialize Firestore and Storage
    const db = getFirestore(app)
    const storage = getStorage(app)

    return { db, storage }
  } catch (error) {
    console.error("Error initializing Firebase services:", error)
    return { db: null, storage: null }
  }
}

// Helper function to check if we're on the client side
const isClient = () => typeof window !== "undefined"

export async function createUserProfile(uid: string, email: string | null, role: UserRole): Promise<UserProfile> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db } = getFirebaseServices()
  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  const userProfile: UserProfile = {
    uid,
    email,
    role,
    verified: role === "Platform Governor" ? true : false, // Platform Governors are auto-verified
    verificationStatus: role === "Platform Governor" ? "verified" : "unverified",
    createdAt: getCurrentTimestamp(),
    completedProfile: false,
    submittedVerification: false,
    savedProjects: [], // Initialize empty saved projects array
  }

  try {
    await setDoc(doc(db, "users", uid), userProfile)
    return userProfile
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isClient()) {
    return null
  }

  const { db } = getFirebaseServices()
  if (!db) {
    return null
  }

  try {
    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db } = getFirebaseServices()
  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  try {
    const docRef = doc(db, "users", uid)
    await updateDoc(docRef, data)
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

export async function updatePersonalInfo(
  uid: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  dateOfBirth: string,
): Promise<void> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db } = getFirebaseServices()
  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  try {
    const docRef = doc(db, "users", uid)
    await updateDoc(docRef, {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      completedProfile: true,
    })
  } catch (error) {
    console.error("Error updating personal info:", error)
    throw error
  }
}

export async function updateAddressInfo(uid: string, address: Address): Promise<void> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db } = getFirebaseServices()
  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  try {
    const docRef = doc(db, "users", uid)
    await updateDoc(docRef, { address })
  } catch (error) {
    console.error("Error updating address info:", error)
    throw error
  }
}

export async function uploadVerificationDocument(
  uid: string,
  file: File,
  documentType: string,
): Promise<VerificationDocument> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db, storage } = getFirebaseServices()
  if (!db || !storage) {
    throw new Error("Firebase services are not initialized")
  }

  try {
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `verification-documents/${uid}/${documentType}-${Date.now()}`)

    // Upload the file
    await uploadBytes(storageRef, file)

    // Get the download URL
    const fileURL = await getDownloadURL(storageRef)

    // Create the document object
    const document: VerificationDocument = {
      type: documentType,
      fileURL,
      uploadedAt: getCurrentTimestamp(),
      status: "pending",
    }

    // Get the current user profile
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile
      const documents = userData.verificationDocuments || []

      // Add the new document
      const updatedDocuments = [...documents.filter((doc) => doc.type !== documentType), document]

      // Update the user profile
      await updateDoc(userRef, {
        verificationDocuments: updatedDocuments,
        submittedVerification: true,
        verificationStatus: "pending",
      })

      return document
    } else {
      throw new Error("User not found")
    }
  } catch (error) {
    console.error("Error uploading verification document:", error)
    throw error
  }
}

export async function verifyUser(uid: string, verified: boolean): Promise<void> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db } = getFirebaseServices()
  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  try {
    const docRef = doc(db, "users", uid)
    await updateDoc(docRef, {
      verified,
      verificationStatus: verified ? "verified" : "rejected",
    })
  } catch (error) {
    console.error("Error verifying user:", error)
    throw error
  }
}

export async function getPendingVerifications(): Promise<UserProfile[]> {
  if (!isClient()) {
    return []
  }

  const { db } = getFirebaseServices()
  if (!db) {
    return []
  }

  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("verificationStatus", "==", "pending"))
    const querySnapshot = await getDocs(q)

    const pendingUsers: UserProfile[] = []
    querySnapshot.forEach((doc) => {
      pendingUsers.push(doc.data() as UserProfile)
    })

    return pendingUsers
  } catch (error) {
    console.error("Error getting pending verifications:", error)
    return []
  }
}

// New function to get all users
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!isClient()) {
    return []
  }

  const { db } = getFirebaseServices()
  if (!db) {
    return []
  }

  try {
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)

    const allUsers: UserProfile[] = []
    querySnapshot.forEach((doc) => {
      allUsers.push(doc.data() as UserProfile)
    })

    return allUsers
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Save a project to user's saved projects
export async function saveProject(uid: string, projectId: string): Promise<void> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db } = getFirebaseServices()
  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      savedProjects: arrayUnion(projectId),
    })
  } catch (error) {
    console.error("Error saving project:", error)
    throw new Error("Failed to save project")
  }
}

// Remove a project from user's saved projects
export async function unsaveProject(uid: string, projectId: string): Promise<void> {
  if (!isClient()) {
    throw new Error("This function can only be called on the client side")
  }

  const { db } = getFirebaseServices()
  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      savedProjects: arrayRemove(projectId),
    })
  } catch (error) {
    console.error("Error unsaving project:", error)
    throw new Error("Failed to unsave project")
  }
}

// Get user's saved projects
export async function getSavedProjects(uid: string): Promise<string[]> {
  if (!isClient()) {
    return []
  }

  const { db } = getFirebaseServices()
  if (!db) {
    return []
  }

  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile
      return userData.savedProjects || []
    }

    return []
  } catch (error) {
    console.error("Error getting saved projects:", error)
    return []
  }
}
