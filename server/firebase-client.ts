// Server-side Firebase operations using Admin SDK (fixed DECODER issue)
import { adminDb } from './firebase-admin.js';
import { randomUUID } from 'crypto';

console.log('Using Firebase Admin SDK for server operations');

// Server-side Firebase operations using Admin SDK
export const serverFirebaseOps = {
  // Feature Packages
  async createFeaturePackage(data: any) {
    try {
      const id = randomUUID();
      const packageData = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await adminDb.collection('featurePackages').doc(id).set(packageData);
      console.log('Feature package created:', id);
      return { id, ...packageData };
    } catch (error) {
      console.error('Error creating feature package:', error);
      throw error;
    }
  },

  async getFeaturePackages() {
    try {
      const snapshot = await adminDb.collection('featurePackages').get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting feature packages:', error);
      return [];
    }
  },

  async getFeaturePackage(id: string) {
    try {
      const doc = await adminDb.collection('featurePackages').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
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
      
      await adminDb.collection('featurePackages').doc(id).update(updateData);
      
      const doc = await adminDb.collection('featurePackages').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error updating feature package:', error);
      throw error;
    }
  },

  async deleteFeaturePackage(id: string) {
    try {
      await adminDb.collection('featurePackages').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting feature package:', error);
      throw error;
    }
  },

  // Analytics
  async getAnalytics() {
    try {
      const tenantsSnapshot = await adminDb.collection('tenants').get();
      const usersSnapshot = await adminDb.collection('users').get();
      const packagesSnapshot = await adminDb.collection('featurePackages').get();
      
      const tenants = tenantsSnapshot.docs.map((doc: any) => doc.data());
      const activeTenants = tenants.filter((t: any) => t.status === 'active');
      
      return {
        totalTenants: tenants.length,
        totalUsers: usersSnapshot.size,
        totalFeaturePackages: packagesSnapshot.size,
        activeTenants: activeTenants.length,
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
      const snapshot = await adminDb.collection('users').get();
      return snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  async deleteUser(uid: string) {
    try {
      await adminDb.collection('users').doc(uid).delete();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Tenants
  async getTenantBySlug(slug: string) {
    try {
      const snapshot = await adminDb.collection('tenants').where('slug', '==', slug).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting tenant by slug:', error);
      return null;
    }
  },

  async verifyIdToken(idToken: string) {
    try {
      const { adminAuth } = await import('./firebase-admin.js');
      return await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw error;
    }
  }
};

export default serverFirebaseOps;