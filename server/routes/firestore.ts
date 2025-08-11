// Server-side Firebase Admin SDK operations
import type { Express } from "express";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { COLLECTIONS } from "@shared/firestore-schema";
import type { 
  UserDoc, 
  TenantDoc, 
  FeaturePackageDoc, 
  EventDoc,
  CustomerDoc,
  LeadDoc 
} from "@shared/firestore-schema";

const db = getFirestore();
const adminAuth = getAuth();

export function registerFirestoreRoutes(app: Express) {
  // Super admin setup - create initial super admin
  app.post('/api/admin/setup-super-admin', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Get or create Firebase user
      let firebaseUser;
      try {
        firebaseUser = await adminAuth.getUserByEmail(email);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create Firebase user
          firebaseUser = await adminAuth.createUser({
            email,
            password: 'admin123',
            emailVerified: true,
          });
        } else {
          throw error;
        }
      }

      // Create user document in Firestore
      const userDoc: Partial<UserDoc> = {
        email,
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true,
        isSuperAdmin: true,
      };

      await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set({
        ...userDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add to super admins collection
      await db.collection(COLLECTIONS.SUPER_ADMINS).doc(firebaseUser.uid).set({
        userId: firebaseUser.uid,
        createdAt: new Date(),
      });

      res.json({ 
        message: 'Super admin created successfully',
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });
    } catch (error) {
      console.error('Error setting up super admin:', error);
      res.status(500).json({ message: 'Failed to setup super admin' });
    }
  });

  // Get current user with tenant info
  app.get('/api/auth/me', async (req, res) => {
    try {
      // Check session or Firebase token
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

      const userData = userDoc.data() as UserDoc;
      
      // Check if super admin
      const superAdminDoc = await db.collection(COLLECTIONS.SUPER_ADMINS).doc(decodedToken.uid).get();
      const isSuperAdmin = superAdminDoc.exists;

      if (isSuperAdmin) {
        return res.json({
          ...userData,
          id: userDoc.id,
          uid: decodedToken.uid,
          isSuperAdmin: true,
          currentTenant: null,
        });
      }

      // Get user's tenant relationships
      const tenantUsersSnapshot = await db.collection(COLLECTIONS.TENANT_USERS)
        .where('userId', '==', decodedToken.uid)
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
        ...userData,
        id: userDoc.id,
        uid: decodedToken.uid,
        isSuperAdmin: false,
        currentTenant,
      });

    } catch (error) {
      console.error('Error getting user:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  });

  // Initialize default feature packages
  app.post('/api/admin/init-packages', async (req, res) => {
    try {
      const packages: Omit<FeaturePackageDoc, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Starter',
          slug: 'starter',
          status: 'active',
          billingModes: {
            monthly: { amount: 29, currency: 'USD' },
            yearly: { amount: 290, currency: 'USD' }
          },
          description: 'Perfect for small venues getting started',
          limits: {
            maxUsers: 3,
            maxVenues: 1,
            maxSpacesPerVenue: 5
          },
          features: {
            basicBookings: true,
            customerManagement: true,
            basicReports: true,
            emailSupport: true
          },
          priceMonthly: 29,
          priceYearly: 290,
          trialDays: 14,
          sortOrder: 1
        },
        {
          name: 'Professional',
          slug: 'professional', 
          status: 'active',
          billingModes: {
            monthly: { amount: 79, currency: 'USD' },
            yearly: { amount: 790, currency: 'USD' }
          },
          description: 'Advanced features for growing venues',
          limits: {
            maxUsers: 10,
            maxVenues: 3,
            maxSpacesPerVenue: 15
          },
          features: {
            basicBookings: true,
            customerManagement: true,
            basicReports: true,
            emailSupport: true,
            advancedReports: true,
            proposalSystem: true,
            taskManagement: true,
            stripeIntegration: true
          },
          priceMonthly: 79,
          priceYearly: 790,
          trialDays: 14,
          sortOrder: 2
        },
        {
          name: 'Enterprise',
          slug: 'enterprise',
          status: 'active',
          billingModes: {
            monthly: { amount: 199, currency: 'USD' },
            yearly: { amount: 1990, currency: 'USD' }
          },
          description: 'Complete venue management solution',
          limits: {
            maxUsers: -1, // unlimited
            maxVenues: -1,
            maxSpacesPerVenue: -1
          },
          features: {
            basicBookings: true,
            customerManagement: true,
            basicReports: true,
            emailSupport: true,
            advancedReports: true,
            proposalSystem: true,
            taskManagement: true,
            stripeIntegration: true,
            aiFeatures: true,
            voiceBooking: true,
            smartScheduling: true,
            aiInsights: true,
            multiVenueManagement: true,
            prioritySupport: true,
            customIntegrations: true
          },
          priceMonthly: 199,
          priceYearly: 1990,
          trialDays: 30,
          sortOrder: 3
        }
      ];

      for (const packageData of packages) {
        // Check if package already exists
        const existingSnapshot = await db.collection(COLLECTIONS.FEATURE_PACKAGES)
          .where('slug', '==', packageData.slug)
          .get();

        if (existingSnapshot.empty) {
          await db.collection(COLLECTIONS.FEATURE_PACKAGES).add({
            ...packageData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`Created package: ${packageData.name}`);
        } else {
          console.log(`Package ${packageData.name} already exists, skipping...`);
        }
      }

      res.json({ message: 'Default feature packages initialized successfully' });
    } catch (error) {
      console.error('Error initializing packages:', error);
      res.status(500).json({ message: 'Failed to initialize packages' });
    }
  });

  // Get feature packages for public pricing page
  app.get('/api/feature-packages', async (req, res) => {
    try {
      const snapshot = await db.collection(COLLECTIONS.FEATURE_PACKAGES)
        .where('status', '==', 'active')
        .orderBy('sortOrder')
        .get();

      const packages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(packages);
    } catch (error) {
      console.error('Error fetching feature packages:', error);
      res.status(500).json({ message: 'Failed to fetch feature packages' });
    }
  });

  // Tenant creation during signup
  app.post('/api/tenants/create', async (req, res) => {
    try {
      const { name, slug, planSlug, userId, userRole = 'owner' } = req.body;

      if (!name || !slug || !planSlug || !userId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if slug is available
      const existingTenant = await db.collection(COLLECTIONS.TENANTS)
        .where('slug', '==', slug)
        .get();

      if (!existingTenant.empty) {
        return res.status(409).json({ message: 'Company URL is already taken' });
      }

      // Get feature package
      const packageSnapshot = await db.collection(COLLECTIONS.FEATURE_PACKAGES)
        .where('slug', '==', planSlug)
        .get();

      if (packageSnapshot.empty) {
        return res.status(400).json({ message: 'Invalid plan selected' });
      }

      const featurePackage = packageSnapshot.docs[0];

      // Create tenant
      const tenantData: Omit<TenantDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        slug,
        planSlug,
        featurePackageId: featurePackage.id,
        status: 'active',
        contactName: '',
        contactEmail: '',
        connectStatus: 'pending',
      };

      const tenantRef = await db.collection(COLLECTIONS.TENANTS).add({
        ...tenantData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add user to tenant
      await db.collection(COLLECTIONS.TENANT_USERS).add({
        tenantId: tenantRef.id,
        userId,
        role: userRole,
        permissions: {},
        scopes: {},
        createdAt: new Date(),
      });

      const createdTenant = await tenantRef.get();

      res.json({
        id: tenantRef.id,
        ...createdTenant.data()
      });

    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ message: 'Failed to create tenant' });
    }
  });
}