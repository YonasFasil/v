// Debug endpoint to check tenant data
import type { Express } from "express";
import { getFirestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@shared/firestore-schema";

const db = getFirestore();

export function registerDebugRoutes(app: Express) {
  app.get('/api/debug/user-tenant/:uid', async (req, res) => {
    try {
      const userUid = req.params.uid;
      
      const debugInfo = {
        userUid,
        userDoc: null as any,
        tenantUsers: [] as any[],
        allTenants: [] as any[],
        allTenantUsers: [] as any[]
      };
      
      // 1. Get user document
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userUid).get();
      debugInfo.userDoc = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
      
      // 2. Get tenant_users for this user
      const tenantUsersSnapshot = await db.collection(COLLECTIONS.TENANT_USERS)
        .where('userId', '==', userUid)
        .get();
      debugInfo.tenantUsers = tenantUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 3. Get all tenants
      const tenantsSnapshot = await db.collection(COLLECTIONS.TENANTS).get();
      debugInfo.allTenants = tenantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 4. Get all tenant_users
      const allTenantUsersSnapshot = await db.collection(COLLECTIONS.TENANT_USERS).get();
      debugInfo.allTenantUsers = allTenantUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.json(debugInfo);
      
    } catch (error) {
      console.error('Debug error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}