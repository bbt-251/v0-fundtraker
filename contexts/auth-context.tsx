"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase/firebase"
import {
    type User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import type { UserProfile, UserRole } from "@/types/user"

interface AuthContextType {
    user: User | null
    userProfile: UserProfile | null
    loading: boolean
    error: string | null
    signUp: (email: string, password: string, role: UserRole) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    error: null,
    signUp: async () => { },
    signIn: async () => { },
    logout: async () => { },
    updateUserProfile: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Listen for auth state changes
    useEffect(() => {
        console.log("Setting up auth state listener...")
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user")
                setUser(user)

                if (user) {
                    try {
                        // Fetch user profile from Firestore
                        const userDoc = await getDoc(doc(db, "users", user.uid))
                        if (userDoc.exists()) {
                            setUserProfile(userDoc.data() as UserProfile)
                        } else {
                            console.log("No user profile found, creating default profile")
                            // Create a default profile if none exists
                            const defaultProfile: UserProfile = {
                                uid: user.uid,
                                displayName: "",
                                email: user.email || "",
                                role: userDoc.data()?.role,
                                createdAt: new Date().toISOString(),
                                verified: false,
                                verificationStatus: "unverified",
                                completedProfile: false,
                                submittedVerification: false,
                            }
                            await setDoc(doc(db, "users", user.uid), defaultProfile)
                            setUserProfile(defaultProfile)
                        }
                    } catch (err) {
                        console.error("Error fetching user profile:", err)
                        setError("Failed to load user profile")
                    }
                } else {
                    setUserProfile(null)
                }

                setLoading(false)
            },
            (error) => {
                console.error("Auth state change error:", error)
                setError(error.message)
                setLoading(false)
            },
        )

        // Cleanup subscription
        return () => unsubscribe()
    }, [])

    // Sign up function
    const signUp = async (email: string, password: string, role: UserRole) => {
        try {
            setLoading(true);
            setError(null);

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Determine verification fields based on role
            const isPlatformGovernor = role === "Platform Governor";
            const verified = isPlatformGovernor ? true : false;
            const verificationStatus = isPlatformGovernor ? "verified" : "unverified";

            // Create user profile in Firestore
            const newProfile: UserProfile = {
                uid: userCredential.user.uid,
                email,
                role, // Use the role passed from the signup page
                createdAt: new Date().toISOString(),
                verified,
                verificationStatus,
                completedProfile: false,
                submittedVerification: false,
            };

            await setDoc(doc(db, "users", userCredential.user.uid), newProfile);
            setUserProfile(newProfile);
        } catch (err: any) {
            console.error("Sign up error:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Sign in function
    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true)
            setError(null)
            await signInWithEmailAndPassword(auth, email, password)
        } catch (err: any) {
            console.error("Sign in error:", err)
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Logout function
    const logout = async () => {
        try {
            setLoading(true)
            setError(null)
            await signOut(auth)
        } catch (err: any) {
            console.error("Logout error:", err)
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Update user profile
    const updateUserProfile = async (profile: Partial<UserProfile>) => {
        try {
            if (!user) throw new Error("No user logged in")

            setLoading(true)
            setError(null)

            // Update profile in Firestore
            const userRef = doc(db, "users", user.uid)
            await setDoc(userRef, profile, { merge: true })

            // Update local state
            const updatedProfile = { ...userProfile, ...profile } as UserProfile
            setUserProfile(updatedProfile)
        } catch (err: any) {
            console.error("Update profile error:", err)
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const value = {
        user,
        userProfile,
        loading,
        error,
        signUp,
        signIn,
        logout,
        updateUserProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
