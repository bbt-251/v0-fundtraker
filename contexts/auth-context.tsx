"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { UserProfile, UserRole } from "@/types/user"
import { LoadingAnimation } from "@/components/loading-animation"

// Import Firebase modules
import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  type User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth"
import { firebaseConfig } from "@/lib/firebase/config"
import { createUserProfile, getUserProfile } from "@/services/user-service"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, role: UserRole) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

// Create a default context value
const defaultContextValue: AuthContextType = {
  user: null,
  userProfile: null,
  loading: true,
  signUp: async () => {
    throw new Error("AuthProvider not initialized")
  },
  signIn: async () => {
    throw new Error("AuthProvider not initialized")
  },
  signOut: async () => {
    throw new Error("AuthProvider not initialized")
  },
  resetPassword: async () => {
    throw new Error("AuthProvider not initialized")
  },
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

// Initialize Firebase app once
let firebaseInitialized = false
let app: any = null
let auth: any = null

const initializeFirebaseApp = () => {
  if (firebaseInitialized) return { app, auth }

  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.log("Not initializing Firebase in server context")
      return { app: null, auth: null }
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    auth = getAuth(app)
    firebaseInitialized = true
    console.log("Firebase initialized successfully")
    return { app, auth }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    return { app: null, auth: null }
  }
}

// Initialize Firebase on module load if in browser
if (typeof window !== "undefined") {
  initializeFirebaseApp()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize Firebase and set up auth state listener
  useEffect(() => {
    if (!isClient) return

    let unsubscribe: any = null

    const setupAuthListener = async () => {
      try {
        // Make sure Firebase is initialized
        const { auth } = initializeFirebaseApp()

        if (!auth) {
          console.error("Auth is not available")
          setLoading(false)
          return
        }

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            setUser(user)

            // Fetch user profile if user is logged in
            if (user) {
              try {
                const profile = await getUserProfile(user.uid)
                setUserProfile(profile)
              } catch (error) {
                console.error("Error fetching user profile:", error)
                setUserProfile(null)
              }
            } else {
              setUserProfile(null)
            }

            setLoading(false)
          },
          (error) => {
            console.error("Auth state change error:", error)
            setLoading(false)
          },
        )
      } catch (error) {
        console.error("Error setting up auth listener:", error)
        setLoading(false)
      }
    }

    setupAuthListener()

    // Clean up the auth state listener
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [isClient])

  // Handle redirects based on auth state
  useEffect(() => {
    if (isClient && !loading) {
      if (user) {
        // If user is authenticated and on auth pages, redirect to appropriate dashboard
        if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
          // Redirect based on user role
          if (userProfile?.role === "Donor") {
            router.push("/donor-dashboard")
          } else {
            router.push("/dashboard")
          }
        }
      } else {
        // If user is not authenticated and trying to access protected routes
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/projects") ||
          pathname.startsWith("/account") ||
          pathname.startsWith("/users") ||
          pathname.startsWith("/donor-dashboard") ||
          pathname.startsWith("/donated-projects")
        ) {
          router.push("/login")
        }
      }
    }
  }, [user, userProfile, loading, router, isClient, pathname])

  // Helper function to ensure Firebase auth is initialized
  const getFirebaseAuth = async () => {
    if (!isClient) {
      throw new Error("Cannot use Firebase on the server")
    }

    // Initialize Firebase if not already initialized
    const { auth } = initializeFirebaseApp()

    if (!auth) {
      throw new Error("Authentication service is not available")
    }

    return auth
  }

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const auth = await getFirebaseAuth()

      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create the user profile in Firestore
      await createUserProfile(userCredential.user.uid, email, role)

      // Redirect based on role
      if (role === "Donor") {
        router.push("/donor-dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Error during sign up:", error)
      throw new Error(error.message || "Failed to sign up")
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const auth = await getFirebaseAuth()

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      // Redirect will happen in the useEffect based on user role
      if (userCredential.user) {
        // After successful login, redirect to dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Error during sign in:", error)
      throw new Error(error.message || "Failed to sign in")
    }
  }

  const signOut = async () => {
    try {
      const auth = await getFirebaseAuth()

      await firebaseSignOut(auth)
      router.push("/login")
    } catch (error: any) {
      console.error("Error during sign out:", error)
      throw new Error(error.message || "Failed to sign out")
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const auth = await getFirebaseAuth()

      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error("Error during password reset:", error)
      throw new Error(error.message || "Failed to reset password")
    }
  }

  const contextValue: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  // Show loading animation while initializing Firebase
  if (loading && isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
