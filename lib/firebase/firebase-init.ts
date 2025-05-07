"use client"

import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { firebaseConfig } from "./config"

// Initialize Firebase only on the client side
let app, auth, db, storage
let initialized = false

// Function to initialize Firebase with proper error handling
export const initializeFirebase = () => {
  if (typeof window === "undefined") {
    console.log("Cannot initialize Firebase on server")
    return { app: null, auth: null, db: null, storage: null }
  }

  if (initialized) {
    return { app, auth, db, storage }
  }

  try {
    // Check if Firebase is already initialized
    if (!getApps().length) {
      console.log("Initializing Firebase app...")
      app = initializeApp(firebaseConfig)
    } else {
      console.log("Firebase app already initialized")
      app = getApps()[0]
    }

    // Initialize Firebase services
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    initialized = true
    console.log("Firebase services initialized successfully")

    return { app, auth, db, storage }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    return { app: null, auth: null, db: null, storage: null }
  }
}

// Initialize on import if in browser
if (typeof window !== "undefined") {
  // Add a small delay to ensure proper initialization
  setTimeout(() => {
    initializeFirebase()
  }, 100)
}

export { app, auth, db, storage }
