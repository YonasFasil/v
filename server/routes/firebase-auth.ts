// Firebase-only authentication routes
import type { Express } from "express";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { COLLECTIONS } from "@shared/firestore-schema";

const db = getFirestore();
const adminAuth = getAuth();

export function registerFirebaseAuthRoutes(app: Express) {
  // Signup route - create user in Firebase Auth and Firestore
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { firstName, lastName, email, password, companyName, planSlug } = req.body;

      if (!firstName || !lastName || !email || !password || !companyName || !planSlug) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Create Firebase user
      const firebaseUser = await adminAuth.createUser({
        email,
        password,
        emailVerified: false,
        displayName: `${firstName} ${lastName}`,
      });

      // Create user document in Firestore
      await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set({
        email,
        firstName,
        lastName,
        emailVerified: false,
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create tenant
      const tenantData = {
        name: companyName,
        slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        planSlug,
        status: 'active',
        contactName: `${firstName} ${lastName}`,
        contactEmail: email,
        connectStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tenantRef = await db.collection(COLLECTIONS.TENANTS).add(tenantData);

      // Add user to tenant
      await db.collection(COLLECTIONS.TENANT_USERS).add({
        tenantId: tenantRef.id,
        userId: firebaseUser.uid,
        role: 'owner',
        permissions: {},
        scopes: {},
        createdAt: new Date(),
      });

      // Send custom token for immediate authentication
      const customToken = await adminAuth.createCustomToken(firebaseUser.uid);

      res.json({
        message: 'Account created successfully',
        customToken,
        user: {
          uid: firebaseUser.uid,
          email,
          firstName,
          lastName,
        },
        tenant: {
          id: tenantRef.id,
          name: companyName,
          slug: tenantData.slug,
        }
      });

    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  // Login route - verify Firebase token and return user data
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // This endpoint is mainly for super admin login using server-side auth
      // Regular users will authenticate directly with Firebase client SDK
      
      try {
        const firebaseUser = await adminAuth.getUserByEmail(email);
        
        // Verify this is a super admin
        const superAdminDoc = await db.collection(COLLECTIONS.SUPER_ADMINS).doc(firebaseUser.uid).get();
        
        if (!superAdminDoc.exists) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create custom token for super admin
        const customToken = await adminAuth.createCustomToken(firebaseUser.uid);
        
        // Get user data
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();
        const userData = userDoc.data();

        res.json({
          message: 'Login successful',
          customToken,
          user: {
            uid: firebaseUser.uid,
            ...userData,
            isSuperAdmin: true,
          }
        });

      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        throw error;
      }

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No auth token provided' });
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Get user document
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      
      // Check if super admin
      const superAdminDoc = await db.collection(COLLECTIONS.SUPER_ADMINS).doc(decodedToken.uid).get();
      const isSuperAdmin = superAdminDoc.exists;

      if (isSuperAdmin) {
        return res.json({
          user: {
            ...userData,
            uid: decodedToken.uid,
            id: decodedToken.uid,
            isSuperAdmin: true,
          }
        });
      }

      // Get user's current tenant
      const tenantUsersSnapshot = await db.collection(COLLECTIONS.TENANT_USERS)
        .where('userId', '==', decodedToken.uid)
        .limit(1)
        .get();

      let currentTenant = null;
      if (!tenantUsersSnapshot.empty) {
        const tenantUser = tenantUsersSnapshot.docs[0].data();
        const tenantDoc = await db.collection(COLLECTIONS.TENANTS).doc(tenantUser.tenantId).get();
        
        if (tenantDoc.exists) {
          currentTenant = {
            id: tenantDoc.id,
            ...tenantDoc.data(),
            role: tenantUser.role,
          };
        }
      }

      res.json({
        user: {
          ...userData,
          uid: decodedToken.uid,
          id: decodedToken.uid,
          isSuperAdmin: false,
          currentTenant,
        }
      });

    } catch (error) {
      console.error('Auth me error:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  });

  // Session sync endpoint - stores Firebase UID in session for middleware compatibility
  app.post('/api/auth/sync-session', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No auth token provided' });
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Get user document
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      
      // Store Firebase UID in session for middleware compatibility
      (req.session as any).firebaseUid = decodedToken.uid;
      (req.session as any).user = {
        id: decodedToken.uid,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        isSuperAdmin: userData.isSuperAdmin || false,
      };

      res.json({ 
        message: 'Session synced successfully',
        user: (req.session as any).user
      });

    } catch (error) {
      console.error('Session sync error:', error);
      res.status(500).json({ message: 'Session sync failed' });
    }
  });

  // Logout route
  app.post('/api/auth/logout', async (req, res) => {
    try {
      // Clear session data
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });
}