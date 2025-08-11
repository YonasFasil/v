// Client-side Firebase operations to bypass Firebase Admin SDK issues
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  connectFirestoreEmulator 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "948784074321",
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase client SDK for server-side operations
const serverApp = initializeApp(firebaseConfig, 'server-client');
const serverDb = getFirestore(serverApp);

console.log('Firebase Client SDK initialized for server operations');

// Server-side Firebase operations using client SDK
export const serverFirebaseOps = {
  // Feature Packages
  async createFeaturePackage(data: any) {
    try {
      const docRef = doc(collection(serverDb, 'featurePackages'));
      const packageData = {
        ...data,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(docRef, packageData);
      console.log('Feature package created:', docRef.id);
      return { id: docRef.id, ...packageData };
    } catch (error) {
      console.error('Error creating feature package:', error);
      throw error;
    }
  },

  async getFeaturePackages() {
    try {
      const querySnapshot = await getDocs(collection(serverDb, 'featurePackages'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting feature packages:', error);
      return [];
    }
  },

  async getFeaturePackage(id: string) {
    try {
      const docSnapshot = await getDoc(doc(serverDb, 'featurePackages', id));
      if (docSnapshot.exists()) {
        return { id: docSnapshot.id, ...docSnapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting feature package:', error);
      return null;
    }
  },

  async updateFeaturePackage(id: string, data: any) {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(serverDb, 'featurePackages', id), updateData);
      
      const updatedDoc = await getDoc(doc(serverDb, 'featurePackages', id));
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error updating feature package:', error);
      throw error;
    }
  },

  async deleteFeaturePackage(id: string) {
    try {
      await deleteDoc(doc(serverDb, 'featurePackages', id));
      return true;
    } catch (error) {
      console.error('Error deleting feature package:', error);
      throw error;
    }
  },

  // Analytics
  async getAnalytics() {
    try {
      // Get counts from different collections
      const [tenantsSnap, usersSnap, packagesSnap] = await Promise.all([
        getDocs(collection(serverDb, 'tenants')),
        getDocs(collection(serverDb, 'users')),
        getDocs(collection(serverDb, 'featurePackages'))
      ]);

      return {
        totalTenants: tenantsSnap.size,
        totalUsers: usersSnap.size,
        totalFeaturePackages: packagesSnap.size,
        activeTenants: 0, // We'll calculate this based on active status
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalTenants: 0,
        totalUsers: 0, 
        totalFeaturePackages: 0,
        activeTenants: 0,
        lastUpdated: new Date()
      };
    }
  },

  // Users
  async getUsers() {
    try {
      const querySnapshot = await getDocs(collection(serverDb, 'users'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  async deleteUser(id: string) {
    try {
      await deleteDoc(doc(serverDb, 'users', id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};

export default serverFirebaseOps;