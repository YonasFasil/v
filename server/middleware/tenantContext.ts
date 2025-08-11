import type { Request, Response, NextFunction } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { COLLECTIONS } from '@shared/firestore-schema';

// Extended Request interface to include tenant context
export interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: any;
  userRole?: string;
  user?: any;
}

// Tenant context middleware - extracts tenant from Firebase user session
export const tenantContext = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore();

    // Skip tenant context for superadmin routes, public routes, and non-authenticated routes
    if (req.path.startsWith('/api/superadmin') || 
        req.path.startsWith('/api/public') || 
        req.path.startsWith('/api/auth') || 
        !(req.session as any)?.firebaseUid) {
      return next();
    }

    const firebaseUid = (req.session as any).firebaseUid;

    // Get user from Firestore to check super admin status
    try {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(firebaseUid).get();
      
      if (!userDoc.exists) {
        return res.status(401).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      
      // Block super admins from accessing tenant routes
      if (userData?.isSuperAdmin === true) {
        console.log('Blocking super admin from accessing tenant route:', req.path);
        return res.status(403).json({ 
          message: 'Super admin users cannot access tenant routes. Please use super admin dashboard.' 
        });
      }
    } catch (error) {
      console.error('User lookup error:', error);
      return res.status(500).json({ message: 'Authentication error' });
    }

    // Get user's tenant context from Firestore
    const tenantUsersSnapshot = await db.collection(COLLECTIONS.TENANT_USERS)
      .where('userId', '==', firebaseUid)
      .limit(1)
      .get();

    if (tenantUsersSnapshot.empty) {
      return res.status(403).json({ 
        message: 'No active tenant found for user' 
      });
    }

    const tenantUserDoc = tenantUsersSnapshot.docs[0];
    const tenantUserData = tenantUserDoc.data();
    
    // Get tenant information
    const tenantDoc = await db.collection(COLLECTIONS.TENANTS).doc(tenantUserData.tenantId).get();
    
    if (!tenantDoc.exists || tenantDoc.data()?.status !== 'active') {
      return res.status(403).json({ 
        message: 'No active tenant found for user' 
      });
    }

    const tenantData = tenantDoc.data();

    // Set tenant context on request
    req.tenantId = tenantUserData.tenantId;
    req.tenant = {
      id: tenantData.id || tenantUserData.tenantId,
      name: tenantData.name,
      slug: tenantData.slug,
      status: tenantData.status,
    };
    req.userRole = tenantUserData.role;
    req.user = { id: firebaseUid };

    next();
  } catch (error) {
    console.error('Tenant context middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Super admin middleware - checks if user is a super admin using Firebase
export const requireSuperAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore();
    
    console.log('requireSuperAdmin: session check', req.session?.firebaseUid);
    
    // Check session-based authentication first
    if (!(req.session as any)?.firebaseUid) {
      console.log('No Firebase UID in session');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const firebaseUid = (req.session as any).firebaseUid;

    // Get user from Firestore
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(firebaseUid).get();
    
    if (!userDoc.exists) {
      console.log('User not found in Firestore');
      return res.status(401).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Check if user is super admin
    if (!userData?.isSuperAdmin) {
      console.log('User not authorized for super admin, redirecting to login');
      return res.status(403).json({ 
        message: 'Access denied. Super admin privileges required.' 
      });
    }

    console.log('Super admin authenticated:', userData.email);
    
    // Add user data to request
    req.user = {
      id: firebaseUid,
      email: userData.email,
      isSuperAdmin: true
    };

    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};