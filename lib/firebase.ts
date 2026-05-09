import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA-R0r3-UnihxjZl7nLxvNHADVtYf1J0OU",
  authDomain: "tradingnexus-2aa7a.firebaseapp.com",
  projectId: "tradingnexus-2aa7a",
  storageBucket: "tradingnexus-2aa7a.firebasestorage.app",
  messagingSenderId: "888695960816",
  appId: "1:888695960816:web:de1fd4eb67e26f5a697e35",
  measurementId: "G-CMBZQD1P1F",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export default app
