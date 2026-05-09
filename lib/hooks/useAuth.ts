'use client'

import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    return firebaseSignOut(auth)
  }

  const signInWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider)
  }

  return { user, loading, signIn, signUp, signOut, signInWithGoogle }
}
