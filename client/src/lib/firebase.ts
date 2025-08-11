import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA543_XOxgTQTb50BDKGGR4gV0SQYIxwRE",
  authDomain: "venuine-519d3.firebaseapp.com",
  projectId: "venuine-519d3",
  storageBucket: "venuine-519d3.firebasestorage.app",
  messagingSenderId: "948784074321",
  appId: "1:948784074321:web:f1351c2b98de55b5e7b270",
};

// Debug configuration
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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