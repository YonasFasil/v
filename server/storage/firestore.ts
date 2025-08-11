import { adminDb } from '../firebase-admin';
import { randomUUID } from 'crypto';

// Firestore-based storage implementation
export class FirestoreStorage {
  
  // Feature Packages
  async getFeaturePackages() {
    try {
      const snapshot = await adminDb.collection('featurePackages').get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting feature packages:', error);
      return [];
    }
  }

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
  }

  async createFeaturePackage(data: any) {
    try {
      const id = randomUUID();
      const packageData = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'active'
      };
      
      await adminDb.collection('featurePackages').doc(id).set(packageData);
      return { id, ...packageData };
    } catch (error) {
      console.error('Error creating feature package:', error);
      throw error;
    }
  }

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
  }

  async deleteFeaturePackage(id: string) {
    try {
      await adminDb.collection('featurePackages').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting feature package:', error);
      return false;
    }
  }

  // Tenants
  async getTenants(searchTerm?: string, statusFilter?: string) {
    try {
      let query: any = adminDb.collection('tenants');
      
      if (statusFilter && statusFilter !== '') {
        query = query.where('status', '==', statusFilter);
      }
      
      const snapshot = await query.get();
      let tenants = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      if (searchTerm) {
        tenants = tenants.filter((tenant: any) => 
          tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.slug?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return tenants;
    } catch (error) {
      console.error('Error getting tenants:', error);
      return [];
    }
  }

  async getTenant(id: string) {
    try {
      const doc = await adminDb.collection('tenants').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting tenant:', error);
      return null;
    }
  }

  async createTenant(data: any) {
    try {
      const id = randomUUID();
      const tenantData = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'active'
      };
      
      await adminDb.collection('tenants').doc(id).set(tenantData);
      return { id, ...tenantData };
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  // Users
  async getUsers() {
    try {
      const snapshot = await adminDb.collection('users').get();
      return snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async deleteUser(uid: string) {
    try {
      await adminDb.collection('users').doc(uid).delete();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Analytics
  async getAnalytics() {
    try {
      const tenantsSnapshot = await adminDb.collection('tenants').get();
      const usersSnapshot = await adminDb.collection('users').get();
      
      const tenants = tenantsSnapshot.docs.map((doc: any) => doc.data());
      const activeTenants = tenants.filter((t: any) => t.status === 'active');
      
      return {
        totalTenants: tenants.length,
        activeTenants: activeTenants.length,
        totalUsers: usersSnapshot.size,
        recentActivity: [] // Can be implemented later
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        recentActivity: []
      };
    }
  }
}

export const firestoreStorage = new FirestoreStorage();