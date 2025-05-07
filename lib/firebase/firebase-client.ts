"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { firebaseConfig } from "./config"

// Initialize Firebase only on the client side
let app, db, auth, storage

// Helper function to safely get Firebase services
export const getFirebaseServices = () => {
  if (typeof window === "undefined") {
    return { app: null, db: null, auth: null, storage: null }
  }

  try {
    if (!app) {
      // Initialize Firebase app
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

      // Initialize Firebase services immediately
      db = getFirestore(app)
      auth = getAuth(app)
      storage = getStorage(app)
    }

    return { app, db, auth, storage }
  } catch (error) {
    console.error("Firebase initialization error:", error)
    return { app: null, db: null, auth: null, storage: null }
  }
}

// Initialize on import if in browser
if (typeof window !== "undefined") {
  const services = getFirebaseServices()
  app = services.app
  db = services.db
  auth = services.auth
  storage = services.storage
}

export { app, db, auth, storage }
