import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { firebaseConfig } from "./config"

// Initialize Firebase (prevent multiple initializations)
let app, db, storage

// Only initialize if we're not already initialized
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
} else {
  app = getApp()
  db = getFirestore(app)
  storage = getStorage(app)
}

// Export Firebase services
export { app, db, storage }
