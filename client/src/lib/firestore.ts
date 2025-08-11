import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

export interface FirestoreUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  isSuperAdmin: boolean;
  createdAt?: any;
  updatedAt?: any;
  currentTenant?: {
    id: string;
    slug: string;
    role: string;
  };
}

// Create or update user in Firestore
export async function createOrUpdateUser(firebaseUser: User): Promise<FirestoreUser> {
  console.log('createOrUpdateUser called for:', firebaseUser.email);
  
  const userRef = doc(db, 'users', firebaseUser.uid);
  console.log('Getting user document from Firestore...');
  const userDoc = await getDoc(userRef);
  
  const isSuperAdmin = firebaseUser.email === 'yonasfasil.sl@gmail.com';
  console.log('Is super admin?', isSuperAdmin, 'for email:', firebaseUser.email);
  
  if (userDoc.exists()) {
    console.log('User exists in Firestore, updating...');
    // Update existing user
    const userData = userDoc.data() as FirestoreUser;
    await updateDoc(userRef, {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      updatedAt: serverTimestamp(),
    });
    
    const updatedUser = {
      ...userData,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
    };
    console.log('User updated in Firestore:', updatedUser);
    return updatedUser;
  } else {
    console.log('Creating new user in Firestore...');
    // Create new user
    const newUser: FirestoreUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      isSuperAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(userRef, newUser);
    console.log('New user created in Firestore:', newUser);
    return newUser;
  }
}

// Get user from Firestore
export async function getUser(uid: string): Promise<FirestoreUser | null> {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data() as FirestoreUser;
  }
  
  return null;
}

// Check if user is super admin
export async function checkSuperAdmin(email: string): Promise<boolean> {
  return email === 'yonasfasil.sl@gmail.com';
}