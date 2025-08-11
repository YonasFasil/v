import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA543_XOxgTQTb50BDKGGR4gV0SQYIxwRE",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "venuine-519d3"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "venuine-519d3",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "venuine-519d3"}.firebasestorage.app`,
  messagingSenderId: "948784074321",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:948784074321:web:f1351c2b98de55b5e7b270",
};

// Debug configuration
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...'
});

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Auth functions
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

export const handleAuthRedirect = () => {
  return getRedirectResult(auth);
};

export const logOut = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Export the app for other Firebase services
export default app;