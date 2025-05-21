"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"
import { firebaseConfig } from "./lib/firebase/config"

// Initialize Firebase (prevent multiple initializations)
let app, db, storage, auth

// Only initialize if we're not already initialized
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
} else {
  app = getApp()
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
}

// Export Firebase services
export { app, db, storage, auth }
